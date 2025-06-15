import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain, Save, Download, HelpCircle } from 'lucide-react';

import { ClassManager } from '@/components/class-manager';
import { TrainingControls } from '@/components/training-controls';
import { PredictionDisplay } from '@/components/prediction-display';
import { ModelStats } from '@/components/model-stats';
import { TutorialOverlay } from '@/components/tutorial-overlay';

import { useTensorFlow } from '@/hooks/use-tensorflow';
import { TrainingClass, Prediction, ModelStats as IModelStats } from '@/types/ml-types';

export default function TeachableMachine() {
  const { toast } = useToast();
  const {
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
    clearError
  } = useTensorFlow();

  const [classes, setClasses] = useState<TrainingClass[]>([
    {
      id: 'class-1',
      name: 'Class A',
      color: 'bg-green-500',
      samples: []
    },
    {
      id: 'class-2', 
      name: 'Class B',
      color: 'bg-orange-500',
      samples: []
    }
  ]);

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelStats, setModelStats] = useState<IModelStats>({
    totalClasses: 0,
    totalSamples: 0,
    accuracy: 0,
    inferenceTime: 0
  });
  const [showTutorial, setShowTutorial] = useState(false);

  // Initialize TensorFlow and load base model
  useEffect(() => {
    if (isInitialized && !model.baseModel) {
      loadBaseModel();
    }
  }, [isInitialized, model.baseModel, loadBaseModel]);

  // Show errors as toast notifications
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Create model when classes change
  useEffect(() => {
    if (model.baseModel && classes.length >= 2) {
      createModel(classes);
    }
  }, [model.baseModel, classes, createModel]);

  // Update model stats
  useEffect(() => {
    const totalSamples = classes.reduce((sum, cls) => sum + cls.samples.length, 0);
    setModelStats(prev => ({
      ...prev,
      totalClasses: classes.length,
      totalSamples
    }));
  }, [classes]);

  const handleStartTraining = useCallback((epochs: number) => {
    // Validate training data
    const classesWithSamples = classes.filter(cls => cls.samples.length > 0);
    if (classesWithSamples.length < 2) {
      toast({
        title: "Training Error",
        description: "You need at least 2 classes with training samples",
        variant: "destructive",
      });
      return;
    }

    const minSamples = Math.min(...classesWithSamples.map(cls => cls.samples.length));
    if (minSamples < 3) {
      toast({
        title: "Training Warning", 
        description: "For best results, add at least 3 samples per class",
        variant: "destructive",
      });
      return;
    }

    startTraining(classes, epochs);
  }, [classes, startTraining, toast]);

  const handlePredict = useCallback(async (element: HTMLVideoElement | HTMLImageElement) => {
    if (!model.isReady) {
      toast({
        title: "Model Not Ready",
        description: "Please train the model first",
        variant: "destructive",
      });
      return;
    }

    try {
      const startTime = Date.now();
      const predictions = await makePrediction(element, classes);
      const inferenceTime = (Date.now() - startTime) / 1000;
      
      setPredictions(predictions);
      setModelStats(prev => ({ ...prev, inferenceTime }));
    } catch (err) {
      toast({
        title: "Prediction Error",
        description: err instanceof Error ? err.message : "Failed to make prediction",
        variant: "destructive",
      });
    }
  }, [model.isReady, makePrediction, classes, toast]);

  const handleExportModel = useCallback(async () => {
    try {
      await exportModel();
      toast({
        title: "Export Successful",
        description: "Model has been downloaded to your device",
      });
    } catch (err) {
      toast({
        title: "Export Failed", 
        description: "Failed to export model. Please try again.",
        variant: "destructive",
      });
    }
  }, [exportModel, toast]);

  const handleSaveProject = useCallback(() => {
    // For now, just show a message
    toast({
      title: "Save Project",
      description: "Project saving feature coming soon!",
    });
  }, [toast]);

  const canTrain = model.baseModel && classes.length >= 2 && 
    classes.some(cls => cls.samples.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Advanced Teachable Machine</h1>
                <p className="text-sm text-gray-500">Enhanced ML Training Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowTutorial(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                使い方ガイド
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSaveProject}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </Button>
              <Button 
                onClick={handleExportModel}
                disabled={!model.isReady}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Model
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps Guide */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">機械学習モデル作成ガイド</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">クラス作成</h3>
                <p className="text-sm text-gray-500">分類するクラスを追加</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                classes.some(cls => cls.samples.length > 0) 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">画像収集</h3>
                <p className="text-sm text-gray-500">各クラスの画像を追加</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                model.isReady 
                  ? 'bg-green-100 text-green-600' 
                  : canTrain 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">モデル学習</h3>
                <p className="text-sm text-gray-500">AIモデルをトレーニング</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                model.isReady 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                4
              </div>
              <div>
                <h3 className="font-medium text-gray-900">予測テスト</h3>
                <p className="text-sm text-gray-500">カメラでモデルをテスト</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Training Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Class Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">クラスの作成</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  分類したいクラスを作成してください（例：猫、犬など）
                </p>
              </div>
              <div className="p-6">
                <ClassManager 
                  classes={classes}
                  onClassesChange={setClasses}
                />
              </div>
            </div>

            {/* Step 2: Image Collection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    classes.some(cls => cls.samples.length > 0) 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">画像の収集</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {classes.some(cls => cls.samples.length > 0) 
                    ? '各クラスに画像を追加済みです。さらに追加することで精度が向上します。'
                    : '各クラスに学習用画像をドラッグ&ドロップまたはカメラで追加してください'
                  }
                </p>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls, index) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${cls.color}`}></div>
                        <span className="font-medium">{cls.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {cls.samples.length} 枚の画像
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-600">
                    各クラスに少なくとも10枚以上の画像を追加することを推奨します
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Training */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    canTrain ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">モデルの学習</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  画像を追加したら、AIモデルをトレーニングしてください
                </p>
              </div>
              <div className="p-6">
                <TrainingControls
                  trainingStatus={trainingStatus}
                  trainingProgress={trainingProgress}
                  onStartTraining={handleStartTraining}
                  onExportModel={handleExportModel}
                  canTrain={canTrain}
                  classes={classes}
                  trainingHistory={trainingHistory}
                />
              </div>
            </div>
          </div>

          {/* Testing/Prediction Section */}
          <div className="space-y-6">
            {/* Step 4: Prediction Testing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                    model.isReady ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    4
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">予測テスト</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  学習完了後、カメラでモデルをテストできます
                </p>
              </div>
              <div className="p-6">
                <PredictionDisplay
                  predictions={predictions}
                  onPredict={handlePredict}
                  isModelReady={model.isReady}
                  classes={classes}
                />
              </div>
            </div>

            <ModelStats
              stats={modelStats}
              classes={classes}
              onShareModel={() => toast({
                title: "Share Model",
                description: "Model sharing feature coming soon!",
              })}
            />
          </div>
        </div>
      </div>

      {/* Loading overlay for initialization */}
      {!isInitialized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Initializing TensorFlow.js...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
