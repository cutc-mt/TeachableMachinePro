import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, X, VideoOff } from 'lucide-react';
import { useWebcam } from '@/hooks/use-webcam';

interface WebcamCaptureProps {
  onCapture: (imageData: { blob: Blob; url: string; imageData: ImageData }) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
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
  
  const [capturedCount, setCapturedCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);

  const handleStartWebcam = async () => {
    setIsStarting(true);
    clearError();
    try {
      await startWebcam();
    } finally {
      setIsStarting(false);
    }
  };

  const handleCapture = async () => {
    try {
      const imageData = await captureImage();
      onCapture(imageData);
      setCapturedCount(prev => prev + 1);
      setJustCaptured(true);
      
      // Reset the flash effect after a short delay
      setTimeout(() => setJustCaptured(false), 300);
    } catch (err) {
      console.error('Capture error:', err);
    }
  };

  const handleClose = () => {
    stopWebcam();
    onClose();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Capture Training Images
          </DialogTitle>
          <DialogDescription>
            Use your camera to capture training images for your machine learning model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isSupported ? (
            <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <VideoOff className="w-12 h-12 mx-auto mb-4 opacity-80" />
                <p className="text-lg font-medium mb-2">Camera Not Supported</p>
                <p className="text-sm opacity-80">Your browser doesn't support camera access</p>
              </div>
            </div>
          ) : error ? (
            <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <VideoOff className="w-12 h-12 mx-auto mb-4 opacity-80" />
                <p className="text-lg font-medium mb-2">Camera Error</p>
                <p className="text-sm opacity-80">{error}</p>
                <Button 
                  variant="secondary" 
                  className="mt-4"
                  onClick={handleStartWebcam}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
              {/* Always render video element but conditionally show it */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isActive ? 'block' : 'hidden'
                } ${justCaptured ? 'brightness-150 border-4 border-white' : ''}`}
              />
              
              {/* Overlay for camera start */}
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <p className="text-lg font-medium mb-2">Camera Preview</p>
                    <p className="text-sm opacity-80 mb-4">Click "Start Camera" to begin</p>
                    <Button 
                      onClick={handleStartWebcam}
                      disabled={isStarting}
                    >
                      {isStarting ? 'Starting Camera...' : 'Start Camera'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="hidden"
          />

          {/* Status Bar */}
          {isActive && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Camera Active - Ready for continuous capture
                  </span>
                </div>
                {capturedCount > 0 && (
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                    {capturedCount} images
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {capturedCount === 0 ? (
                "Click capture to take your first image"
              ) : (
                `${capturedCount} images captured - keep going!`
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button 
                onClick={handleCapture}
                disabled={!isActive}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
