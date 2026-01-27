'use client'

import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { ImageFile } from './types';

interface ImageUploaderProps {
  onImageSelected: (image: ImageFile) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Extract base64 content
      const base64Data = result.split(',')[1];
      
      onImageSelected({
        file,
        previewUrl: result,
        base64: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 ${
        isDragging 
          ? 'border-primary bg-primary/10' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-slate-700 p-4 rounded-full mb-4">
        <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">Upload your old photo</h3>
      <p className="text-slate-400 mb-6 max-w-sm">
        Drag and drop your image here, or click to browse. 
        Supports JPG, PNG, and WebP.
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <Button onClick={() => fileInputRef.current?.click()}>
        Select Photo
      </Button>
    </div>
  );
};