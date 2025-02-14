import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUpload = ({ onUpload, isLoading }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    disabled: isLoading,
    maxFiles: 1
  });

  return (
    <div className="p-6 bg-apple-light dark:bg-[#2c2c2e] rounded-2xl transition-colors duration-200">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-apple-blue bg-apple-blue/10' 
            : 'border-gray-300 dark:border-gray-600 hover:border-apple-blue'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600 dark:text-gray-300">
          {isLoading 
            ? 'Analyzing image...' 
            : isDragActive 
              ? 'Drop the image here' 
              : 'Drop your tattoo image here, or click to select'
          }
        </p>
      </div>
    </div>
  );
};

export default ImageUpload;