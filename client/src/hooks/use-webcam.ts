import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebcamProps {
  width?: number;
  height?: number;
}

export function useWebcam({ width = 640, height = 480 }: UseWebcamProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError('Camera access is not supported in this browser');
    }
  }, []);

  const startWebcam = useCallback(async () => {
    console.log('Attempting to start webcam...', { isSupported, hasVideoRef: !!videoRef.current });
    
    if (!isSupported) {
      console.error('Webcam not supported');
      setError('カメラがサポートされていません');
      return;
    }

    try {
      setError(null);
      console.log('Requesting camera permissions...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera stream obtained successfully');
      streamRef.current = stream;
      
      // Set video stream directly since video element is always present
      if (videoRef.current) {
        console.log('Setting video stream to video element');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting playback');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsActive(true);
              console.log('Webcam started successfully');
            }).catch((playError) => {
              console.error('Video play error:', playError);
              setError('カメラの再生を開始できません。ブラウザの設定を確認してください。');
            });
          }
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          setError('ビデオの再生中にエラーが発生しました。');
        };
      } else {
        console.error('Video ref still not available');
        setError('カメラの初期化に失敗しました。ページを再読み込みして再試行してください。');
      }
      
    } catch (err) {
      console.error('Error accessing webcam:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('カメラのアクセスが拒否されました。ブラウザでカメラの許可を有効にしてください。');
        } else if (err.name === 'NotFoundError') {
          setError('カメラが見つかりません。カメラが接続されているか確認してください。');
        } else if (err.name === 'NotReadableError') {
          setError('カメラが他のアプリケーションで使用中です。他のアプリを閉じてから再試行してください。');
        } else {
          setError(`カメラエラー: ${err.message}`);
        }
      } else {
        setError('カメラの開始中に不明なエラーが発生しました。');
      }
    }
  }, [isSupported, width, height]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureImage = useCallback((): Promise<{ blob: Blob; url: string; imageData: ImageData }> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current || !isActive) {
        reject(new Error('Webcam not active or elements not ready'));
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, imageData });
        } else {
          reject(new Error('Failed to capture image'));
        }
      }, 'image/jpeg', 0.8);
    });
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    videoRef,
    canvasRef,
    isActive,
    isSupported,
    error,
    startWebcam,
    stopWebcam,
    captureImage,
    clearError: () => setError(null)
  };
}
