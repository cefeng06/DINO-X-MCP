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
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DinoXApiClient } from "./dino-x/client.js";
import { parseArgs } from "./utils/index.js";
import { APIResponse } from "./types/index.js";

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
 * Handler for listing available notes as resources.
 * Each note is exposed as a resource with:
 * - A note:// URI scheme
 * - Plain text MIME type
 * - Human readable name and description (now including the note title)
 */
// server.setRequestHandler(ListResourcesRequestSchema, async () => {
//   return {
//     resources: Object.entries(notes).map(([id, note]) => ({
//       uri: `note:///${id}`,
//       mimeType: "text/plain",
//       name: note.title,
//       description: `A text note: ${note.title}`
//     }))
//   };
// });

/**
 * Handler for reading the contents of a specific note.
 * Takes a note:// URI and returns the note content as plain text.
 */
// server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
//   const url = new URL(request.params.uri);
//   const id = url.pathname.replace(/^\//, '');
//   const note = notes[id];

//   if (!note) {
//     throw new Error(`Note ${id} not found`);
//   }

//   return {
//     contents: [{
//       uri: request.params.uri,
//       mimeType: "text/plain",
//       text: note.content
//     }]
//   };
// });

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
        description: "Analyze an image to detect all identifiable objects, returning the category, count, and coordinate positions for each object.",
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

  if (!apiKey) {
    throw new Error("dinox-api-key is required");
  }

  switch (request.params.name) {
    case "object-detection-by-text": {
      const imageFileUri = String(request.params.arguments?.imageFileUri);
      const textPrompt = String(request.params.arguments?.textPrompt);
      const withCaption = Boolean(request.params.arguments?.includeDescription);

      if (!imageFileUri || !textPrompt) {
        throw new Error("Image file URI and text prompt are required");
      }

      const dinoXClient = new DinoXApiClient(apiKey);
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
        return {
          name: obj.category,
          bbox: {
            xmin: obj.bbox[0],
            ymin: obj.bbox[1],
            xmax: obj.bbox[2],
            ymax: obj.bbox[3]
          },
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

      const dinoXClient = new DinoXApiClient(apiKey);
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
        return {
          name: obj.category,
          bbox: {
            xmin: obj.bbox[0],
            ymin: obj.bbox[1],
            xmax: obj.bbox[2],
            ymax: obj.bbox[3]
          },
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
    default: {
      throw new Error("Unknown tool");
    }
  }
});

/**
 * Handler that lists available prompts.
 * Exposes a single "summarize_notes" prompt that summarizes all notes.
 */
// server.setRequestHandler(ListPromptsRequestSchema, async () => {
//   return {
//     prompts: [
//       {
//         name: "summarize_notes",
//         description: "Summarize all notes",
//       }
//     ]
//   };
// });

/**
 * Handler for the summarize_notes prompt.
 * Returns a prompt that requests summarization of all notes, with the notes' contents embedded as resources.
 */
// server.setRequestHandler(GetPromptRequestSchema, async (request) => {
//   if (request.params.name !== "summarize_notes") {
//     throw new Error("Unknown prompt");
//   }

//   const embeddedNotes = Object.entries(notes).map(([id, note]) => ({
//     type: "resource" as const,
//     resource: {
//       uri: `note:///${id}`,
//       mimeType: "text/plain",
//       text: note.content
//     }
//   }));

//   return {
//     messages: [
//       {
//         role: "user",
//         content: {
//           type: "text",
//           text: "Please summarize the following notes:"
//         }
//       },
//       ...embeddedNotes.map(note => ({
//         role: "user" as const,
//         content: note
//       })),
//       {
//         role: "user",
//         content: {
//           type: "text",
//           text: "Provide a concise summary of all the notes above."
//         }
//       }
//     ]
//   };
// });

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
