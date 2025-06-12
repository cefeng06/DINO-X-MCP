import axios, { AxiosInstance } from "axios";
import fs from "fs";
import { APIResponse, TaskResponse } from "../types/index.js";

export interface DinoXApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

export class DinoXApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly axiosClient: AxiosInstance;

  constructor(config: DinoXApiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        Token: `${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
  }

  async createTask<T>(endpoint: string, payload: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error("API Key is missing");
    }

    try {
      const response = await this.axiosClient.post(
        `task/${endpoint}`,
        payload
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to create task: ${response.data.msg}`);
      }

      const taskUuid = response.data.data.task_uuid;

      const maxRetries = 60;
      const retryInterval = 1000;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        const statusResponse = await this.axiosClient.get<TaskResponse<T>>(
          `task_status/${taskUuid}`,
        );

        const status = statusResponse.data;

        if (status.data.status === "failed") {
          throw new Error(status.data.error || "Task failed");
        }

        if (status.data.status === "success" && status.data.result) {
          return status.data.result;
        }

        if (status.data.status === "waiting" || status.data.status === "running") {
          await new Promise(resolve => setTimeout(resolve, retryInterval));
          retryCount++;
          continue;
        }

        throw new Error("Task polling timeout");
      }

      throw new Error("Task polling timeout");
    } catch (error) {
      console.error("API request error:", error);
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        if (error.response.status === 400) {
          throw new Error(`Invalid parameters: ${data.errors?.join(", ")}`);
        }
        throw new Error(
          `API error (${error.response.status}): ${JSON.stringify(data)}`
        );
      }
      throw error;
    }
  }

  async detectObjectsByText(
    imageFileUri: string,
    textPrompt: string,
    includeDescription: boolean
  ): Promise<{
    objects: {
      category: string;
      score: number;
      bbox: [number, number, number, number];
      caption?: string;
    }[]
  }> {
    let imageDataUri: string;
    if (imageFileUri.startsWith("file://")) {
      const imageFilePath = imageFileUri.replace('file://', '');
      const imageBuffer = await fs.promises.readFile(imageFilePath);
      const base64Image = imageBuffer.toString('base64');
      imageDataUri = `data:image/png;base64,${base64Image}`;
    } else if (imageFileUri.startsWith("https://")) {
      imageDataUri = imageFileUri;
    } else {
      throw new Error("Invalid image file URI");
    }

    try {
      const detactionApiPayload = {
        model: "DINO-X-1.0",
        image: imageDataUri,
        prompt: {
          type: "text",
          text: textPrompt
        },
        targets: ["bbox"],
        bbox_threshold: 0.25,
        iou_threshold: 0.8
      };

      const detectionRsp = await this.createTask<APIResponse.DINOX>("dinox/detection", detactionApiPayload);

      if (!includeDescription || detectionRsp.objects.length === 0) return detectionRsp;

      const regions = detectionRsp.objects.map(obj => obj.bbox);
      const captionApiPayload = {
        model: "DINO-X-1.0",
        image: imageDataUri,
        regions,
        targets: ["caption"],
      };
      const captionRsp = await this.createTask<APIResponse.DINOXRegionVL>("dinox/region_vl", captionApiPayload);

      const objects = detectionRsp.objects.map((obj, index) => {
        const captionObj = captionRsp.objects[index];
        return {
          ...obj,
          ...captionObj,
        };
      });

      return {
        objects,
      };

    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }

  }

  async detectAllObjects(
    imageFileUri: string,
    includeDescription: boolean
  ): Promise<{
    objects: {
      category: string;
      score: number;
      bbox: [number, number, number, number];
      caption?: string;
    }[]
  }> {
    let imageDataUri: string;
    if (imageFileUri.startsWith("file://")) {
      const imageFilePath = imageFileUri.replace('file://', '');
      const imageBuffer = await fs.promises.readFile(imageFilePath);
      const base64Image = imageBuffer.toString('base64');
      imageDataUri = `data:image/png;base64,${base64Image}`;
    } else if (imageFileUri.startsWith("https://")) {
      imageDataUri = imageFileUri;
    } else {
      throw new Error("Invalid image file URI");
    }

    try {
      const detactionApiPayload = {
        model: "DINO-X-1.0",
        image: imageDataUri,
        prompt: {
          type: "universal",
          universal: 1
        },
        targets: ["bbox"],
        bbox_threshold: 0.25,
        iou_threshold: 0.8
      };

      const detectionRsp = await this.createTask<APIResponse.DINOX>("dinox/detection", detactionApiPayload);

      if (!includeDescription || detectionRsp.objects.length === 0) return detectionRsp;

      const regions = detectionRsp.objects.map(obj => obj.bbox);
      const captionApiPayload = {
        model: "DINO-X-1.0",
        image: imageDataUri,
        regions,
        targets: ["caption"],
      };
      const captionRsp = await this.createTask<APIResponse.DINOXRegionVL>("dinox/region_vl", captionApiPayload);
      const objects = detectionRsp.objects.map((obj, index) => {
        const captionObj = captionRsp.objects[index];
        return {
          ...obj,
          ...captionObj,
        };
      });
      return {
        objects,
      };

    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  async detectHumanPoseKeypoints(
    imageFileUri: string,
    includeDescription: boolean
  ): Promise<{
    objects: {
      category: string;
      score: number;
      bbox: [number, number, number, number];
      pose?: number[];
      caption?: string;
    }[]
  }> {
    let imageDataUri: string;
    if (imageFileUri.startsWith("file://")) {
      const imageFilePath = imageFileUri.replace('file://', '');
      const imageBuffer = await fs.promises.readFile(imageFilePath);
      const base64Image = imageBuffer.toString('base64');
      imageDataUri = `data:image/png;base64,${base64Image}`;
    } else if (imageFileUri.startsWith("https://")) {
      imageDataUri = imageFileUri;
    } else {
      throw new Error("Invalid image file URI");
    }

    try {
      const detactionApiPayload = {
        model: "DINO-X-1.0",
        image: imageDataUri,
        prompt: {
          type: "text",
          text: "person"
        },
        targets: ["bbox", "pose_keypoints"],
        bbox_threshold: 0.25,
        iou_threshold: 0.8
      };

      const detectionRsp = await this.createTask<APIResponse.DINOX>("dinox/detection", detactionApiPayload);

      if (!includeDescription || detectionRsp.objects.length === 0) return detectionRsp;

      const regions = detectionRsp.objects.map(obj => obj.bbox);
      const captionApiPayload = {
        model: "DINO-X-1.0",
        image: imageDataUri,
        regions,
        targets: ["caption"],
      };
      const captionRsp = await this.createTask<APIResponse.DINOXRegionVL>("dinox/region_vl", captionApiPayload);
      const objects = detectionRsp.objects.map((obj, index) => {
        const captionObj = captionRsp.objects[index];
        return {
          ...obj,
          ...captionObj,
        };
      });
      return {
        objects,
      };

    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }
}