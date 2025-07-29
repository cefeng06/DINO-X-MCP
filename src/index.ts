#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DinoXApiClient } from "./dino-x/client.js";
import { parseArgs, parseBbox, parsePoseKeypoints, type DetectionResult } from "./utils/index.js";

/**
 * Type alias for a note object.
 */
type Note = { title: string, content: string };

/**
 * Simple in-memory storage for notes.
 * In a real implementation, this would likely be backed by a database.
 */
const notes: { [id: string]: Note } = {};

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "DINO-X-MCP",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "object-detection-by-text",
        description: "Analyze an image based on a text prompt to identify and count specific objects, and return detailed descriptions of the objects and their 2D coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            imageFileUri: {
              type: "string",
              description: `URI of the input image. Preferred for remote or local files. Must start with "https://" or "file://".`,
            },
            textPrompt: {
              type: "string",
              description: "Nouns of target objects (English only, avoid adjectives). Use periods to separate multiple categories (e.g., 'person.car.traffic light')."
            },
            includeDescription: {
              type: "boolean",
              description: "Whether to return a description of the objects detected in the image, but will take longer to process.",
            }
          },
          required: ["imageFileUri", "textPrompt", "includeDescription"]
        }
      },
      {
        name: "detect-all-objects",
        description: "Analyze an image to detect all identifiable objects, returning the category, count, coordinate positions and detailed descriptions for each object.",
        inputSchema: {
          type: "object",
          properties: {
            imageFileUri: {
              type: "string",
              description: `URI of the input image. Preferred for remote or local files. Must start with "https://" or "file://".`,
            },
            includeDescription: {
              type: "boolean",
              description: "Whether to return a description of the objects detected in the image, but will take longer to process.",
            }
          },
          required: ["imageFileUri", "includeDescription"]
        }
      },
      {
        name: "detect-human-pose-keypoints",
        description: "Detects 17 keypoints for each person in an image, supporting body posture and movement analysis.",
        inputSchema: {
          type: "object",
          properties: {
            imageFileUri: {
              type: "string",
              description: `URI of the input image. Preferred for remote or local files. Must start with "https://" or "file://".`,
            },
            includeDescription: {
              type: "boolean",
              description: "Whether to return a description of the objects detected in the image, but will take longer to process.",
            }
          },
          required: ["imageFileUri", "includeDescription"]
        }
      }
    ]
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = parseArgs();
  const apiKey = args["dinox-api-key"] || process.env.DINOX_API_KEY || "";
  const baseUrl = "https://api.deepdataspace.com/v2/";

  if (!apiKey) {
    throw new Error("dinox-api-key is required");
  }

  const dinoXClient = new DinoXApiClient({
    apiKey,
    baseUrl,
    timeout: 60000
  });

  switch (request.params.name) {
    case "object-detection-by-text": {
      const imageFileUri = String(request.params.arguments?.imageFileUri);
      const textPrompt = String(request.params.arguments?.textPrompt);
      const withCaption = Boolean(request.params.arguments?.includeDescription);

      if (!imageFileUri || !textPrompt) {
        throw new Error("Image file URI and text prompt are required");
      }

      const { objects } = await dinoXClient.detectObjectsByText(imageFileUri, textPrompt, withCaption);

      const categories: {
        [key: string]: {
          category: string;
          score: number;
          bbox: [number, number, number, number];
        }[]
      } = {};

      for (const object of objects) {
        if (!categories[object.category]) {
          categories[object.category] = [];
        }
        categories[object.category].push(object);
      }

      const objectsInfo = objects.map(obj => {
        const bbox = parseBbox(obj.bbox);
        return {
          name: obj.category,
          bbox,
          ...(withCaption ? {
            description: obj.caption,
          } : {}),
        }
      });

      return {
        content: [
          {
            type: "text",
            text: `Objects detected in image: ${Object.keys(categories).map(cat =>
              `${cat} (${categories[cat].length})`
            )?.join(', ')}.`
          },
          {
            type: "text",
            text: `Detailed object detection results: ${JSON.stringify((objectsInfo), null, 2)}`
          },
          {
            type: "text",
            text: `Note: The bbox coordinates are in {xmin, ymin, xmax, ymax} format, where the origin (0,0) is at the top-left corner of the image. These coordinates help determine the exact position and spatial relationships of objects in the image.`
          },
        ]
      };
    }
    case "detect-all-objects": {
      const imageFileUri = String(request.params.arguments?.imageFileUri);
      const withCaption = Boolean(request.params.arguments?.includeDescription);

      if (!imageFileUri) {
        throw new Error("Image file URI is required");
      }

      const { objects } = await dinoXClient.detectAllObjects(imageFileUri, withCaption);

      const categories: {
        [key: string]: {
          category: string;
          score: number;
          bbox: [number, number, number, number];
        }[]
      } = {};

      for (const object of objects) {
        if (!categories[object.category]) {
          categories[object.category] = [];
        }
        categories[object.category].push(object);
      }

      const objectsInfo = objects.map(obj => {
        const bbox = parseBbox(obj.bbox);
        return {
          name: obj.category,
          bbox,
          ...(withCaption ? {
            description: obj.caption,
          } : {}),
        }
      });

      return {
        content: [
          {
            type: "text",
            text: `Objects detected in image: ${Object.keys(categories).map(cat =>
              `${cat} (${categories[cat].length})`
            )?.join(', ')}.`
          },
          {
            type: "text",
            text: `Detailed object detection results: ${JSON.stringify(objectsInfo, null, 2)}`
          },
          {
            type: "text",
            text: `Note: The bbox coordinates are in [xmin, ymin, xmax, ymax] format, where the origin (0,0) is at the top-left corner of the image. These coordinates help determine the exact position and spatial relationships of objects in the image.`
          },
        ]
      };
    }
    case "detect-human-pose-keypoints": {
      const imageFileUri = String(request.params.arguments?.imageFileUri);
      const withCaption = Boolean(request.params.arguments?.includeDescription);

      if (!imageFileUri) {
        throw new Error("Image file URI is required");
      }

      const { objects } = await dinoXClient.detectHumanPoseKeypoints(imageFileUri, withCaption);

      const categories: {
        [key: string]: {
          category: string;
          score: number;
          bbox: [number, number, number, number];
          pose?: number[];
        }[]
      } = {};

      for (const object of objects) {
        if (!categories[object.category]) {
          categories[object.category] = [];
        }
        categories[object.category].push(object);
      }

      const objectsInfo = objects.map(obj => {
        const bbox = parseBbox(obj.bbox);
        const pose = obj.pose ? parsePoseKeypoints(obj.pose) : undefined;

        return {
          name: obj.category,
          bbox,
          pose,
          ...(withCaption ? {
            description: obj.caption,
          } : {}),
        }
      });

      return {
        content: [
          {
            type: "text",
            text: `${objectsInfo.length} human(s) detected in image.`
          },
          {
            type: "text",
            text: `Detailed human pose keypoints detection results: ${JSON.stringify((objectsInfo), null, 2)}`
          },
          {
            type: "text",
            text: `Note: The bbox coordinates are in {xmin, ymin, xmax, ymax} format, where the origin (0,0) is at the top-left corner of the image. The pose keypoints follow the same coordinate system, with visibility states (not visible, visible).`
          },
        ]
      };
    }
    default: {
      throw new Error("Unknown tool");
    }
  }
});


/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
