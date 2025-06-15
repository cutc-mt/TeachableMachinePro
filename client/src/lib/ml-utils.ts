import * as tf from '@tensorflow/tfjs';

export const MOBILENET_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json';

export async function loadMobileNet() {
  try {
    // Set WebGL backend if available
    await tf.setBackend('webgl');
    const mobilenet = await tf.loadLayersModel(MOBILENET_URL);
    return mobilenet;
  } catch (error) {
    console.error('Failed to load MobileNet with WebGL, trying CPU:', error);
    try {
      // Fallback to CPU backend
      await tf.setBackend('cpu');
      const mobilenet = await tf.loadLayersModel(MOBILENET_URL);
      return mobilenet;
    } catch (cpuError) {
      console.error('Failed to load MobileNet with CPU:', cpuError);
      // Create a simple fallback model
      return createFallbackModel();
    }
  }
}

function createFallbackModel(): tf.LayersModel {
  // Create a simple CNN model as fallback
  const model = tf.sequential({
    layers: [
      tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
      }),
      tf.layers.maxPooling2d({ poolSize: 2 }),
      tf.layers.flatten(),
      tf.layers.dense({ units: 1280, activation: 'relu', name: 'global_average_pooling2d' }),
    ],
  });
  
  return model;
}

export function preprocessImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): tf.Tensor {
  return tf.tidy(() => {
    // Convert to tensor
    const tensor = tf.browser.fromPixels(imageElement);
    
    // Resize to 224x224 (MobileNet input size)
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    
    // Cast to float32
    const casted = resized.cast('float32');
    
    // Normalize to [0, 1]
    const normalized = casted.div(255.0);
    
    // Add batch dimension
    const batched = normalized.expandDims(0);
    
    return batched;
  });
}

export function createTransferModel(baseModel: tf.LayersModel, numClasses: number): tf.LayersModel {
  let featureExtractor: tf.LayersModel;
  
  try {
    // Try to use the base model as feature extractor
    const layerName = baseModel.layers.find(layer => 
      layer.name.includes('global_average_pooling') || 
      layer.name.includes('flatten') ||
      layer.name.includes('dense')
    )?.name;
    
    if (layerName) {
      featureExtractor = tf.model({
        inputs: baseModel.input,
        outputs: baseModel.getLayer(layerName).output
      });
    } else {
      // If no suitable layer found, use the last layer before output
      const secondLastLayer = baseModel.layers[baseModel.layers.length - 2];
      featureExtractor = tf.model({
        inputs: baseModel.input,
        outputs: secondLastLayer.output
      });
    }
  } catch (error) {
    console.error('Error creating feature extractor, using full model:', error);
    featureExtractor = baseModel;
  }
  
  // Freeze the base model
  featureExtractor.trainable = false;
  
  // Create a new model with classification head
  const input = tf.input({ shape: [224, 224, 3] });
  const features = featureExtractor.apply(input) as tf.SymbolicTensor;
  
  // Add a dropout layer for regularization
  const dropout = tf.layers.dropout({ rate: 0.2 }).apply(features) as tf.SymbolicTensor;
  
  const predictions = tf.layers.dense({
    units: numClasses,
    activation: 'softmax',
    name: 'predictions'
  }).apply(dropout) as tf.SymbolicTensor;
  
  const model = tf.model({
    inputs: input,
    outputs: predictions
  });
  
  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  trainingData: { xs: tf.Tensor, ys: tf.Tensor },
  epochs: number,
  onEpochEnd?: (epoch: number, loss: number, accuracy?: number) => void
): Promise<void> {
  const optimizer = tf.train.adam(0.001);
  
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  const history = await model.fit(trainingData.xs, trainingData.ys, {
    epochs: epochs,
    batchSize: 16,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onEpochEnd && logs) {
          onEpochEnd(epoch, logs.loss as number, logs.acc as number);
        }
      }
    }
  });
}

export function predict(model: tf.LayersModel, imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): tf.Tensor {
  const preprocessed = preprocessImage(imageElement);
  const prediction = model.predict(preprocessed) as tf.Tensor;
  preprocessed.dispose();
  return prediction;
}

export async function exportModel(model: tf.LayersModel): Promise<void> {
  try {
    await model.save('downloads://my-teachable-model');
  } catch (error) {
    console.error('Failed to export model:', error);
    throw new Error('Failed to export model. Please try again.');
  }
}

export function createImageFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob from canvas'));
      }
    }, 'image/jpeg', 0.8);
  });
}

export function resizeImage(file: File, maxWidth: number = 224, maxHeight: number = 224): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Calculate new dimensions
      let { width, height } = img;
      const aspectRatio = width / height;
      
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create resized blob'));
        }
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
