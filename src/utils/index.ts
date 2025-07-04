import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

export const parseArgs = () => {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      args[key] = value;
    }
  });
  return args;
}

/**
 * Parse pose keypoints array into a structured object
 * @param pose An array of numbers representing human pose keypoints
 * Format: [x, y, visible, score, x2, y2, visible2, score2, ...]
 * Each keypoint is represented by 4 values:
 * - x: x-coordinate (0 to image width)
 * - y: y-coordinate (0 to image height)
 * - visible: visibility state (0: not visible, 1: visible)
 * - score: confidence score (0-1)
 * 
 * Keypoint order:
 * [nose, l-eye, r-eye, l-ear, r-ear, l-shoulder, r-shoulder, 
 *  l-elbow, r-elbow, l-wrist, r-wrist, l-hip, r-hip, 
 *  l-knee, r-knee, l-ankle, r-ankle]
 * 
 * @returns A structured object with keypoint information
 */
export const parsePoseKeypoints = (pose: number[]) => {
  const keypointNames = [
    'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
    'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
    'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
    'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'
  ];

  const structuredPose: { [key: string]: { x: number; y: number; visible: string; } } = {};

  for (let i = 0; i < keypointNames.length; i++) {
    const baseIndex = i * 4;
    const visibilityMap = {
      0: 'not visible',
      2: 'visible'
    };

    structuredPose[keypointNames[i]] = {
      x: parseFloat(pose[baseIndex].toFixed(1)),
      y: parseFloat(pose[baseIndex + 1].toFixed(1)),
      visible: visibilityMap[pose[baseIndex + 2] as keyof typeof visibilityMap],
    };
  }

  return structuredPose;
};

export const parseBbox = (bbox: number[]) => {
  return {
    xmin: parseFloat(bbox[0].toFixed(1)),
    ymin: parseFloat(bbox[1].toFixed(1)),
    xmax: parseFloat(bbox[2].toFixed(1)),
    ymax: parseFloat(bbox[3].toFixed(1))
  };
};
export interface DetectionResult {
  name: string;
  bbox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  description?: string;
}

export interface VisualizationOptions {
  outputPath?: string;
  fontSize?: number;
  boxThickness?: number;
  colors?: string[];
  showLabels?: boolean;
  showConfidence?: boolean;
}


const DEFAULT_COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // cyan
  '#45B7D1', // blue
  '#FFA07A', // light orange
  '#98D8C8', // light green
  '#F7DC6F', // yellow
  '#BB8FCE', // purple
  '#85C1E9', // sky blue
  '#F8C471', // orange
  '#82E0AA', // green
];

/**
 * Draw detection results on the image
 * @param imageUri image file path or URI
 * @param detections detection results array
 * @param options visualization options
 * @returns the path of the visualized image
 */
export async function visualizeDetections(
  imageUri: string,
  detections: DetectionResult[],
  options: VisualizationOptions = {}
): Promise<string> {
  const imagePath = fileURLToPath(imageUri);
  const image = await loadImage(imagePath);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const {
    fontSize = 24,
    boxThickness = 4,
    colors = DEFAULT_COLORS,
    showLabels = true,
  } = options;

  // create category to color mapping
  const categoryColorMap = new Map<string, string>();
  let colorIndex = 0;

  for (const detection of detections) {
    if (!categoryColorMap.has(detection.name)) {
      categoryColorMap.set(detection.name, colors[colorIndex % colors.length]);
      colorIndex++;
    }
    
    const color = categoryColorMap.get(detection.name)!;
    const { bbox } = detection;
    
    // draw bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = boxThickness;
    ctx.strokeRect(
      bbox.xmin, 
      bbox.ymin, 
      bbox.xmax - bbox.xmin, 
      bbox.ymax - bbox.ymin
    );
    
    // draw label
    if (showLabels) {
      const label = detection.name;
      
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color;
      
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      const padding = 4;
      const bgX = bbox.xmin;
      const bgY = bbox.ymin - textHeight - padding * 2;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = textHeight + padding * 2;
      
      ctx.fillStyle = color;
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      
      ctx.fillStyle = 'white';
      ctx.fillText(label, bgX + padding, bgY + padding + textHeight * 0.8);
    }
  }
  
  const outputPath = options.outputPath || generateOutputPath(imagePath);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

/**
 * Get the default image storage directory based on the operating system
 * @returns default directory path
 */
function getDefaultImageStorageDirectory(): string {
  const platform = os.platform();
  
  switch (platform) {
    case 'win32':
      return path.join(os.tmpdir(), 'dinox-mcp');
    case 'darwin': // macOS
    case 'linux':
      return path.join(os.tmpdir(), 'dinox-mcp');
    default:
      return path.join(os.tmpdir(), 'dinox-mcp');
  }
}

/**
 * Get the configured image storage directory
 * Uses IMAGE_STORAGE_DIRECTORY environment variable if set, otherwise falls back to default
 * @returns image storage directory path
 */
function getImageStorageDirectory(): string {
  const envDir = process.env.IMAGE_STORAGE_DIRECTORY;
  if (envDir) {
    return envDir;
  }
  
  return getDefaultImageStorageDirectory();
}

/**
 * Ensure the directory exists, create if it doesn't
 * @param dirPath directory path to ensure
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate output file path
 * @param originalPath original image path
 * @returns output file path
 */
function generateOutputPath(originalPath: string): string {
  const storageDir = getImageStorageDirectory();
  ensureDirectoryExists(storageDir);
  
  const ext = path.extname(originalPath);
  const basename = path.basename(originalPath, ext);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return path.join(storageDir, `${basename}_visualized_${timestamp}.png`);
}