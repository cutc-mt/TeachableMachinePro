import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, Upload, Camera, X } from 'lucide-react';
import { TrainingClass, ImageSample } from '@/types/ml-types';
import { resizeImage } from '@/lib/ml-utils';
import { useWebcam } from '@/hooks/use-webcam';
import { WebcamCapture } from './webcam-capture';

interface ClassManagerProps {
  classes: TrainingClass[];
  onClassesChange: (classes: TrainingClass[]) => void;
}

const CLASS_COLORS = [
  'bg-green-500',
  'bg-orange-500', 
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500'
];

export function ClassManager({ classes, onClassesChange }: ClassManagerProps) {
  const [dragOverClass, setDragOverClass] = useState<string | null>(null);
  const [showWebcamCapture, setShowWebcamCapture] = useState<string | null>(null);

  const addNewClass = useCallback(() => {
    const newClass: TrainingClass = {
      id: `class-${Date.now()}`,
      name: `Class ${String.fromCharCode(65 + classes.length)}`,
      color: CLASS_COLORS[classes.length % CLASS_COLORS.length],
      samples: []
    };
    onClassesChange([...classes, newClass]);
  }, [classes, onClassesChange]);

  const updateClassName = useCallback((classId: string, newName: string) => {
    const updatedClasses = classes.map(cls => 
      cls.id === classId ? { ...cls, name: newName } : cls
    );
    onClassesChange(updatedClasses);
  }, [classes, onClassesChange]);

  const removeClass = useCallback((classId: string) => {
    const updatedClasses = classes.filter(cls => cls.id !== classId);
    onClassesChange(updatedClasses);
  }, [classes, onClassesChange]);

  const addSampleToClass = useCallback(async (classId: string, file: File) => {
    try {
      const resizedBlob = await resizeImage(file);
      const url = URL.createObjectURL(resizedBlob);
      
      // Create a temporary image to get ImageData
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          const newSample: ImageSample = {
            id: `sample-${Date.now()}-${Math.random()}`,
            imageData,
            blob: resizedBlob,
            url
          };

          const updatedClasses = classes.map(cls => 
            cls.id === classId 
              ? { ...cls, samples: [...cls.samples, newSample] }
              : cls
          );
          onClassesChange(updatedClasses);
        }
      };
      img.src = url;
    } catch (error) {
      console.error('Error adding sample:', error);
    }
  }, [classes, onClassesChange]);

  const removeSample = useCallback((classId: string, sampleId: string) => {
    const updatedClasses = classes.map(cls => {
      if (cls.id === classId) {
        const updatedSamples = cls.samples.filter(sample => {
          if (sample.id === sampleId) {
            URL.revokeObjectURL(sample.url);
            return false;
          }
          return true;
        });
        return { ...cls, samples: updatedSamples };
      }
      return cls;
    });
    onClassesChange(updatedClasses);
  }, [classes, onClassesChange]);

  const handleFileUpload = useCallback((classId: string, files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        addSampleToClass(classId, file);
      }
    });
  }, [addSampleToClass]);

  const handleDragOver = useCallback((e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClass(classId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverClass(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClass(null);
    
    const files = e.dataTransfer.files;
    handleFileUpload(classId, files);
  }, [handleFileUpload]);

  const handleWebcamCapture = useCallback((classId: string, imageData: { blob: Blob; url: string; imageData: ImageData }) => {
    const newSample: ImageSample = {
      id: `sample-${Date.now()}-${Math.random()}`,
      imageData: imageData.imageData,
      blob: imageData.blob,
      url: imageData.url
    };

    const updatedClasses = classes.map(cls => 
      cls.id === classId 
        ? { ...cls, samples: [...cls.samples, newSample] }
        : cls
    );
    onClassesChange(updatedClasses);
    // Don't close webcam capture automatically - let user continue taking photos
  }, [classes, onClassesChange]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Training Classes</h2>
          <p className="text-gray-600 text-sm mt-1">Create classes and add training images</p>
        </div>
        <Button onClick={addNewClass} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      <div className="space-y-4">
        {classes.map((classData, index) => (
          <div key={classData.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${classData.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
                  {index + 1}
                </div>
                <Input
                  value={classData.name}
                  onChange={(e) => updateClassName(classData.id, e.target.value)}
                  className="font-medium bg-transparent border-none focus:ring-0 focus:outline-none p-0 h-auto"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {classData.samples.length} samples
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeClass(classData.id)}
                  className="text-red-500 hover:text-red-700 h-auto p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sample Images Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
              {classData.samples.map((sample) => (
                <div key={sample.id} className="relative group">
                  <img
                    src={sample.url}
                    alt="Training sample"
                    className="w-full h-16 object-cover rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => removeSample(classData.id, sample.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Images Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div
                className={`drag-zone flex-1 border-2 border-dashed rounded-lg p-6 text-center hover:bg-blue-50 transition-all cursor-pointer ${
                  dragOverClass === classData.id ? 'dragover' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, classData.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, classData.id)}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(classData.id, files);
                  };
                  input.click();
                }}
              >
                <Upload className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Drag & drop images here</p>
                <p className="text-xs text-gray-500">or click to browse</p>
              </div>
              <Button
                onClick={() => setShowWebcamCapture(classData.id)}
                className="bg-green-600 hover:bg-green-700 px-4 py-3"
              >
                <Camera className="w-4 h-4 mr-2" />
                Use Webcam
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showWebcamCapture && (
        <WebcamCapture
          onCapture={(imageData) => handleWebcamCapture(showWebcamCapture, imageData)}
          onClose={() => setShowWebcamCapture(null)}
        />
      )}
    </Card>
  );
}
