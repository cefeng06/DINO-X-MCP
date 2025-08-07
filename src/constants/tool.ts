export const BASE_URL = 'https://api.deepdataspace.com/v2/';

export const DEFAULT_TIMEOUT = 60000;

export enum Tool {
  DETECT_BY_TEXT = "detect-objects-by-text",
  DETECT_ALL_OBJECTS = "detect-all-objects",
  DETECT_HUMAN_POSE_KEYPOINTS = "detect-human-pose-keypoints",
  VISUALIZE_DETECTION_RESULT = "visualize-detection-result",
}

export const ToolConfigs: Record<Tool, {
  name: string;
  description: string;
}> = {
  [Tool.DETECT_ALL_OBJECTS]: {
    name: Tool.DETECT_ALL_OBJECTS,
    description: "Analyze an image to detect all identifiable objects, returning the category, count, coordinate positions and detailed descriptions for each object.",
  },
  [Tool.DETECT_BY_TEXT]: {
    name: Tool.DETECT_BY_TEXT,
    description: "Analyze an image based on a text prompt to identify and count specific objects, and return detailed descriptions of the objects and their 2D coordinates.",
  },
  [Tool.DETECT_HUMAN_POSE_KEYPOINTS]: {
    name: Tool.DETECT_HUMAN_POSE_KEYPOINTS,
    description: "Detects 17 keypoints for each person in an image, supporting body posture and movement analysis.",
  },
  [Tool.VISUALIZE_DETECTION_RESULT]: {
    name: Tool.VISUALIZE_DETECTION_RESULT,
    description: "Visualize detection results by drawing bounding boxes and labels on the original image. Images are saved to the directory specified by IMAGE_STORAGE_DIRECTORY environment variable.",
  },
}