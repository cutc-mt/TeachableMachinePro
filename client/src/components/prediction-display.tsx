import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, VideoOff, Camera, Eye } from 'lucide-react';
import { Prediction, TrainingClass } from '@/types/ml-types';
import { useWebcam } from '@/hooks/use-webcam';

interface PredictionDisplayProps {
  predictions: Prediction[];
  onPredict: (element: HTMLVideoElement | HTMLImageElement) => void;
  isModelReady: boolean;
  classes: TrainingClass[];
}

export function PredictionDisplay({ predictions, onPredict, isModelReady, classes }: PredictionDisplayProps) {
  const { 
    videoRef, 
    canvasRef, 
    isActive, 
    isSupported, 
    error, 
    startWebcam, 
    stopWebcam, 
    captureImage,
    clearError 
  } = useWebcam();
  
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);

  const handleToggleWebcam = () => {
    if (isActive) {
      stopWebcam();
    } else {
      clearError();
      startWebcam();
    }
  };

  const handleCapture = async () => {
    try {
      const imageData = await captureImage();
      setLastCapturedImage(imageData.url);
    } catch (err) {
      console.error('Capture error:', err);
    }
  };

  const handlePredict = () => {
    if (videoRef.current && isActive) {
      onPredict(videoRef.current);
    }
  };

  const getClassColor = (prediction: Prediction) => {
    // Find the matching class by name
    const matchingClass = classes.find(cls => cls.name === prediction.className);
    return matchingClass ? matchingClass.color : 'bg-gray-400';
  };

  const topPrediction = predictions.length > 0 ? predictions[0] : null;

  return (
    <div className="space-y-6">
      {/* Webcam Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">モデルテスト</h2>
            <p className="text-sm text-gray-600">
              {isModelReady 
                ? "カメラを開始して、リアルタイムで予測をテストできます" 
                : "先にモデルをトレーニングしてください"
              }
            </p>
          </div>
          <Button
            onClick={handleToggleWebcam}
            className={`${
              isActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={!isSupported || !isModelReady}
          >
            {isActive ? (
              <>
                <VideoOff className="w-4 h-4 mr-2" />
                カメラ停止
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                カメラ開始
              </>
            )}
          </Button>
        </div>
        
        <div className="webcam-container rounded-xl overflow-hidden mb-4 flex items-center justify-center relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
          />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              {!isSupported ? (
                <div className="text-center text-white">
                  <VideoOff className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium mb-2">Camera Not Supported</p>
                  <p className="text-sm opacity-80">Your browser doesn't support camera access</p>
                </div>
              ) : error ? (
                <div className="text-center text-white">
                  <VideoOff className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium mb-2">Camera Error</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              ) : (
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium mb-2">カメラプレビュー</p>
                  <p className="text-sm opacity-80">
                    {isModelReady 
                      ? "「カメラ開始」をクリックしてテストを開始" 
                      : "モデルをトレーニングしてからテストできます"
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Instructions */}
        {isModelReady && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">使用方法：</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 「カメラ開始」ボタンをクリック</li>
              <li>2. トレーニングした対象をカメラに映す</li>
              <li>3. 「予測実行」ボタンをクリックして結果を確認</li>
            </ol>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCapture}
            disabled={!isActive}
          >
            <Camera className="w-4 h-4 mr-2" />
            画像保存
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handlePredict}
            disabled={!isActive || !isModelReady}
          >
            <Eye className="w-4 h-4 mr-2" />
            予測実行
          </Button>
        </div>
      </Card>

      {/* Prediction Results */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">予測結果</h2>
        
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{isModelReady ? "「予測実行」ボタンを押して結果を確認" : "先にモデルをトレーニングしてください"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getClassColor(prediction)} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{prediction.className}</span>
                </div>
                <div className="flex items-center space-x-3 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getClassColor(prediction)}`}
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {prediction.confidence.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}

            {topPrediction && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full ${getClassColor(topPrediction)} text-white font-medium text-lg`}>
                    {topPrediction.className}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">最も高い信頼度: {topPrediction.confidence.toFixed(0)}%</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}