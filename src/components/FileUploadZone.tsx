import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  selectedFiles?: File[];
  onFileRemove?: (index: number) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  maxFiles = 5,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif']
  },
  selectedFiles = [],
  onFileRemove
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileSelect(acceptedFiles);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`upload-zone ${
          isDragActive ? 'border-yellow-500 bg-yellow-50' : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-yellow-600">Dosyaları buraya bırakın...</p>
          ) : (
            <>
              <p className="text-gray-600">
                Dosyaları sürükleyip bırakın veya seçmek için tıklayın
              </p>
              <p className="text-sm text-gray-500 mt-2">
                (Maksimum {maxFiles} dosya)
              </p>
            </>
          )}
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Önizleme ${index + 1}`}
                className="h-24 w-full object-cover rounded-lg shadow-md group-hover:opacity-75 transition-opacity"
              />
              {onFileRemove && (
                <button
                  onClick={() => onFileRemove(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};