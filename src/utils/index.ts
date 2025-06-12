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