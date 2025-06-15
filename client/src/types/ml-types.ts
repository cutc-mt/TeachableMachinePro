export interface TrainingClass {
  id: string;
  name: string;
  color: string;
  samples: ImageSample[];
}

export interface ImageSample {
  id: string;
  imageData: ImageData;
  blob: Blob;
  url: string;
}

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  accuracy: number;
  loss: number;
  samplesProcessed: number;
  timeElapsed: number;
}

export interface Prediction {
  className: string;
  confidence: number;
  classIndex: number;
}

export interface ModelStats {
  totalClasses: number;
  totalSamples: number;
  accuracy: number;
  inferenceTime: number;
}

export type TrainingStatus = 'idle' | 'training' | 'completed' | 'error';

export interface MLModel {
  model: any; // TensorFlow.js model
  modelUrl?: string;
  isReady: boolean;
  baseModel?: any;
}
