import { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { TrainingClass, TrainingProgress, Prediction, MLModel, TrainingStatus } from '@/types/ml-types';
import { loadMobileNet, createTransferModel, trainModel, predict } from '@/lib/ml-utils';

export function useTensorFlow() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [model, setModel] = useState<MLModel>({ model: null, isReady: false });
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle');
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<Array<{ epoch: number; loss: number; accuracy: number; }>>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize TensorFlow.js
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        // Try WebGL first, then fallback to CPU
        try {
          await tf.setBackend('webgl');
          await tf.ready();
          console.log('TensorFlow.js initialized with WebGL backend');
        } catch (webglError) {
          console.warn('WebGL not available, falling back to CPU:', webglError);
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('TensorFlow.js initialized with CPU backend');
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize TensorFlow.js:', err);
        setError('Failed to initialize machine learning framework. Please refresh the page.');
      }
    };

    initTensorFlow();
  }, []);

  // Load base model
  const loadBaseModel = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setError(null);
      const baseModel = await loadMobileNet();
      if (baseModel) {
        setModel(prev => ({ ...prev, baseModel }));
      } else {
        throw new Error('Failed to load base model');
      }
    } catch (err) {
      console.error('Error loading base model:', err);
      setError('Failed to load base model. Please refresh and try again.');
    }
  }, [isInitialized]);

  // Create training model
  const createModel = useCallback(async (classes: TrainingClass[]) => {
    if (!model.baseModel || classes.length < 2) {
      setError('Need at least 2 classes and a loaded base model');
      return;
    }

    try {
      setError(null);
      const transferModel = createTransferModel(model.baseModel, classes.length);
      setModel(prev => ({
        ...prev,
        model: transferModel,
        isReady: false
      }));
    } catch (err) {
      console.error('Error creating model:', err);
      setError('Failed to create training model');
    }
  }, [model.baseModel]);

  // Train model
  const startTraining = useCallback(async (classes: TrainingClass[], epochs: number = 20) => {
    if (!model.model || classes.length < 2) {
      setError('Model not ready or insufficient classes');
      return;
    }

    // Validate that all classes have samples
    const invalidClasses = classes.filter(cls => cls.samples.length === 0);
    if (invalidClasses.length > 0) {
      setError(`Classes "${invalidClasses.map(c => c.name).join('", "')}" have no training samples`);
      return;
    }

    try {
      setTrainingStatus('training');
      setError(null);
      setTrainingHistory([]); // Reset training history
      
      // Prepare training data
      const allImages: HTMLImageElement[] = [];
      const allLabels: number[] = [];
      
      for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        const classData = classes[classIndex];
        for (const sample of classData.samples) {
          const img = new Image();
          img.src = sample.url;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          allImages.push(img);
          allLabels.push(classIndex);
        }
      }

      // Convert to tensors
      const xs = tf.stack(allImages.map(img => {
        return tf.tidy(() => {
          const tensor = tf.browser.fromPixels(img);
          const resized = tf.image.resizeBilinear(tensor, [224, 224]);
          const normalized = resized.cast('float32').div(255.0);
          return normalized;
        });
      }));

      const ys = tf.oneHot(tf.tensor1d(allLabels, 'int32'), classes.length);

      const startTime = Date.now();

      await trainModel(
        model.model,
        { xs, ys },
        epochs,
        (epoch, loss, accuracy) => {
          const timeElapsed = Date.now() - startTime;
          const currentProgress = {
            epoch: epoch + 1,
            totalEpochs: epochs,
            accuracy: (accuracy || 0) * 100,
            loss,
            samplesProcessed: allImages.length,
            timeElapsed: Math.floor(timeElapsed / 1000)
          };
          
          setTrainingProgress(currentProgress);
          
          // Add to training history
          setTrainingHistory(prev => [...prev, {
            epoch: epoch + 1,
            loss,
            accuracy: (accuracy || 0) * 100
          }]);
        }
      );

      // Cleanup tensors
      xs.dispose();
      ys.dispose();

      setModel(prev => ({ ...prev, isReady: true }));
      setTrainingStatus('completed');
    } catch (err) {
      console.error('Training error:', err);
      setError('Training failed. Please check your data and try again.');
      setTrainingStatus('error');
    }
  }, [model.model]);

  // Make predictions
  const makePrediction = useCallback(async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, classes: TrainingClass[]): Promise<Prediction[]> => {
    if (!model.model || !model.isReady) {
      throw new Error('Model not ready for predictions');
    }

    try {
      const prediction = predict(model.model, imageElement);
      const predictionData = await prediction.data();
      prediction.dispose();

      const predictions: Prediction[] = Array.from(predictionData).map((confidence, index) => ({
        className: classes[index]?.name || `Class ${index + 1}`,
        confidence: confidence * 100,
        classIndex: index
      }));

      // Sort by confidence
      predictions.sort((a, b) => b.confidence - a.confidence);

      return predictions;
    } catch (err) {
      console.error('Prediction error:', err);
      throw new Error('Failed to make prediction');
    }
  }, [model.model, model.isReady]);

  // Export model
  const exportModel = useCallback(async () => {
    if (!model.model || !model.isReady) {
      setError('No trained model to export');
      return;
    }

    try {
      await model.model.save('downloads://teachable-machine-model');
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export model');
    }
  }, [model.model, model.isReady]);

  return {
    isInitialized,
    model,
    trainingStatus,
    trainingProgress,
    trainingHistory,
    error,
    loadBaseModel,
    createModel,
    startTraining,
    makePrediction,
    exportModel,
    clearError: () => setError(null)
  };
}
