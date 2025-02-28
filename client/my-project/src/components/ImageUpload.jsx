import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUpload = ({ onUpload, isLoading }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  return (
    <div className="relative">
      <div className="w-full border border-gray-800 rounded-xl bg-zinc-900 shadow-lg">
        <div className="flex flex-col items-center justify-center p-4">
          {isLoading ? (
            <p className="text-gray-300">Processing image...</p>
          ) : (
            <>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-center p-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-gray-500 transition-colors w-full"
              >
                <p className="text-gray-300">Drop your tattoo image here, or click to select</p>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;