"use client";

import { useState } from "react";

interface DimensionInputProps {
  imagePreview: string;
  onConfirm: (width: number, height: number) => void;
  isLoading: boolean;
}

export default function DimensionInput({
  imagePreview,
  onConfirm,
  isLoading,
}: DimensionInputProps) {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const handleConfirm = () => {
    onConfirm(parseFloat(width) || 0, parseFloat(height) || 0);
  };

  const handleSkip = () => {
    onConfirm(0, 0);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 gap-8">
      <div className="w-full max-w-2xl flex gap-6 items-start">
        {/* 預覽圖 */}
        <div className="flex-1 rounded-xl overflow-hidden border border-stone-200 bg-white">
          <img src={imagePreview} alt="草圖預覽" className="w-full object-contain max-h-72" />
        </div>

        {/* 尺寸輸入 */}
        <div className="w-64 flex flex-col gap-5">
          <div>
            <h2 className="text-stone-800 font-semibold text-lg">確認空間尺寸</h2>
            <p className="text-stone-400 text-sm mt-1">
              輸入實際尺寸可大幅提升準確度，若不確定可略過
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">空間總寬度</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="例：450"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400"
                />
                <span className="text-stone-400 text-sm">cm</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1 block">空間總深度</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="例：600"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400"
                />
                <span className="text-stone-400 text-sm">cm</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full bg-stone-800 text-white text-sm py-2.5 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  AI 解析中...
                </>
              ) : (
                "開始解析"
              )}
            </button>
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full text-stone-400 text-sm py-2 hover:text-stone-600 transition-colors"
            >
              略過，讓 AI 自行推估
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
