"use client";

import { useCallback, useState } from "react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export default function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <label
      className={`
        flex flex-col items-center justify-center gap-4
        w-full h-72 rounded-2xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${isDragging ? "border-stone-600 bg-stone-100" : "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50"}
        ${isLoading ? "pointer-events-none opacity-60" : ""}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {isLoading ? (
        <>
          <div className="w-10 h-10 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">AI 解析中，請稍候...</p>
        </>
      ) : (
        <>
          <div className="text-4xl">📐</div>
          <div className="text-center">
            <p className="text-stone-700 font-medium">拖曳草圖至此，或點擊上傳</p>
            <p className="text-stone-400 text-sm mt-1">支援 JPG、PNG、HEIC</p>
          </div>
        </>
      )}
    </label>
  );
}
