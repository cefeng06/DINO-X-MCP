export type TaskStatus = "waiting" | "running" | "success" | "failed";

export interface TaskResponse<T> {
  code: number;
  data: {
    error: string;
    result?: T;
    status: TaskStatus;
    uuid: string;
  };
  msg: string;
}

export namespace APIResponse {
  export interface DINOX {
    objects: {
      category: string;
      score: number;
      bbox: [number, number, number, number];
      pose?: number[];
    }[]
  }

  export interface DINOXRegionVL {
    objects: {
      region: [number, number, number, number];
      caption: string;
      roc: string;
      ocr: string;
    }[];
  }
}
