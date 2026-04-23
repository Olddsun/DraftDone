"use client";

import { useState } from "react";
import UploadZone from "./components/UploadZone";
import DimensionInput from "./components/DimensionInput";
import FloorPlanCanvas from "./components/FloorPlanCanvas";
import RefinementBar from "./components/RefinementBar";
import { FloorPlan } from "./types/floorplan";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Step = "upload" | "dimension" | "preview";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleUpload = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
    setStep("dimension");
  };

  const handleAnalyze = async (spaceWidth: number, spaceHeight: number) => {
    if (!pendingFile) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", pendingFile);
    if (spaceWidth > 0) formData.append("space_width", String(spaceWidth));
    if (spaceHeight > 0) formData.append("space_height", String(spaceHeight));

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`解析失敗：${res.statusText}`);
      const data: FloorPlan = await res.json();
      setFloorPlan(data);
      setStep("preview");
    } catch (e: any) {
      setError(e.message || "發生錯誤，請再試一次");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!floorPlan) return;
    setIsRefining(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floor_plan: floorPlan, instruction }),
      });
      if (!res.ok) throw new Error("修改失敗");
      const updated: FloorPlan = await res.json();
      setFloorPlan(updated);
    } catch (e: any) {
      setError(e.message || "修改失敗，請再試一次");
    } finally {
      setIsRefining(false);
    }
  };

  const handleExport = async () => {
    if (!floorPlan) return;
    setIsExporting(true);
    try {
      const res = await fetch(`${API_URL}/generate-dxf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(floorPlan),
      });
      if (!res.ok) throw new Error("匯出失敗");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "floorplan.dxf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "匯出失敗");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFloorPlan(null);
    setOriginalImage(null);
    setPendingFile(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-200">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight text-stone-800">
            DraftDone
          </span>
          {step === "dimension" && (
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              確認尺寸
            </span>
          )}
          {step === "preview" && (
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              預覽中
            </span>
          )}
        </div>

        {step === "preview" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOriginal((v) => !v)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              {showOriginal ? "隱藏原圖" : "對照原圖"}
            </button>
            <button
              onClick={handleReset}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              重新上傳
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-stone-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  匯出中...
                </>
              ) : (
                "匯出 DXF"
              )}
            </button>
          </div>
        )}

        {step === "dimension" && (
          <button
            onClick={handleReset}
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            重新選圖
          </button>
        )}
      </header>

      {/* Main */}
      <main className="flex flex-1 overflow-hidden">
        {step === "upload" && (
          <div className="flex flex-col items-center justify-center w-full px-8 gap-6">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-semibold text-stone-800">草圖轉 AutoCAD</h1>
              <p className="text-stone-500 mt-2 text-sm">
                上傳手繪或數位草圖，AI 自動解析成可編輯的平面圖
              </p>
            </div>
            <div className="w-full max-w-lg">
              <UploadZone onUpload={handleUpload} isLoading={false} />
            </div>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}
          </div>
        )}

        {step === "dimension" && originalImage && (
          <DimensionInput
            imagePreview={originalImage}
            onConfirm={handleAnalyze}
            isLoading={isLoading}
          />
        )}

        {step === "preview" && floorPlan && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              {/* 畫布 */}
              <div className="flex-1 overflow-hidden">
                <FloorPlanCanvas
                  floorPlan={floorPlan}
                  onFloorPlanChange={setFloorPlan}
                />
              </div>

              {/* 原圖側邊欄 */}
              {showOriginal && originalImage && (
                <div className="w-72 border-l border-stone-200 bg-white p-4 flex flex-col gap-3 overflow-auto">
                  <p className="text-xs text-stone-500 font-medium">原始草圖</p>
                  <img
                    src={originalImage}
                    alt="原始草圖"
                    className="w-full rounded-lg border border-stone-100"
                  />
                </div>
              )}

              {/* 右側資訊欄 */}
              {!showOriginal && (
                <div className="w-64 border-l border-stone-200 bg-white p-5 flex flex-col gap-5 overflow-auto">
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">平面圖資訊</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-stone-600">
                        <span>寬度</span>
                        <span className="font-medium">{floorPlan.canvas_width} cm</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>深度</span>
                        <span className="font-medium">{floorPlan.canvas_height} cm</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>牆面</span>
                        <span className="font-medium">{floorPlan.walls.length} 段</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>門</span>
                        <span className="font-medium">{floorPlan.doors.length} 個</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>窗</span>
                        <span className="font-medium">{floorPlan.windows.length} 個</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>房間</span>
                        <span className="font-medium">{floorPlan.rooms.length} 間</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">房間清單</p>
                    <div className="space-y-1">
                      {floorPlan.rooms.map((room) => (
                        <div
                          key={room.id}
                          className="text-sm text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg"
                        >
                          {room.label}
                        </div>
                      ))}
                      {floorPlan.rooms.length === 0 && (
                        <p className="text-xs text-stone-400">未偵測到房間標籤</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <p className="text-xs text-stone-400 leading-relaxed">
                      滾輪縮放・拖曳牆面微調（自動對齊 90°）・Alt+拖曳平移
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 多輪修正列 */}
            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-4 py-2 text-center">{error}</p>
            )}
            <RefinementBar onRefine={handleRefine} isLoading={isRefining} />
          </div>
        )}
      </main>
    </div>
  );
}
