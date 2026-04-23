"use client";

import { useState } from "react";

interface RefinementBarProps {
  onRefine: (instruction: string) => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  "把所有牆對齊到整數座標",
  "客廳面積放大 20%",
  "門寬改成 90cm",
  "加一個衛浴空間",
];

export default function RefinementBar({ onRefine, isLoading }: RefinementBarProps) {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = () => {
    if (!instruction.trim() || isLoading) return;
    onRefine(instruction.trim());
    setInstruction("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-stone-200 bg-white px-4 py-3 flex flex-col gap-2">
      {/* 快速指令 */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setInstruction(prompt)}
            disabled={isLoading}
            className="text-xs text-stone-500 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 輸入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入修改指令，例：把臥室寬度改成 360cm..."
          disabled={isLoading}
          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-stone-400 disabled:opacity-60"
        />
        <button
          onClick={handleSubmit}
          disabled={!instruction.trim() || isLoading}
          className="bg-stone-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              修改中
            </>
          ) : (
            "送出"
          )}
        </button>
      </div>
    </div>
  );
}
