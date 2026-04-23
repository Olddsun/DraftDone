"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FloorPlan, Wall } from "../types/floorplan";

interface FloorPlanCanvasProps {
  floorPlan: FloorPlan;
  onFloorPlanChange: (updated: FloorPlan) => void;
}

const CANVAS_PADDING = 40;

export default function FloorPlanCanvas({
  floorPlan,
  onFloorPlanChange,
}: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    type: "wall";
    startX: number;
    startY: number;
    origX1: number;
    origY1: number;
    origX2: number;
    origY2: number;
  } | null>(null);

  // 計算初始 scale 讓平面圖填滿容器
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const scaleX = (width - CANVAS_PADDING * 2) / floorPlan.canvas_width;
    const scaleY = (height - CANVAS_PADDING * 2) / floorPlan.canvas_height;
    const initialScale = Math.min(scaleX, scaleY, 2);
    setScale(initialScale);
    setOffset({
      x: (width - floorPlan.canvas_width * initialScale) / 2,
      y: (height - floorPlan.canvas_height * initialScale) / 2,
    });
  }, [floorPlan.canvas_width, floorPlan.canvas_height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 格線背景
    ctx.strokeStyle = "#e5e2dc";
    ctx.lineWidth = 0.5 / scale;
    const gridSize = 50;
    for (let x = 0; x <= floorPlan.canvas_width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, floorPlan.canvas_height);
      ctx.stroke();
    }
    for (let y = 0; y <= floorPlan.canvas_height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(floorPlan.canvas_width, y);
      ctx.stroke();
    }

    // 牆面
    floorPlan.walls.forEach((wall) => {
      const isSelected = selectedId === wall.id;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.strokeStyle = isSelected ? "#d97706" : "#1a1a1a";
      ctx.lineWidth = (wall.thickness || 10) / scale;
      ctx.lineCap = "square";
      ctx.stroke();

      if (isSelected) {
        // 端點控制點
        [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }].forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(x, y, 6 / scale, 0, Math.PI * 2);
          ctx.fillStyle = "#d97706";
          ctx.fill();
        });
      }
    });

    // 門（弧線）
    floorPlan.doors.forEach((door) => {
      ctx.beginPath();
      ctx.arc(door.x, door.y, door.width, 0, Math.PI / 2);
      ctx.strokeStyle = "#0066cc";
      ctx.lineWidth = 1.5 / scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(door.x, door.y);
      ctx.lineTo(door.x + door.width, door.y);
      ctx.stroke();
    });

    // 窗戶（雙線）
    floorPlan.windows.forEach((win) => {
      const offset5 = 5;
      ctx.strokeStyle = "#0099cc";
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.moveTo(win.x1, win.y1);
      ctx.lineTo(win.x2, win.y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(win.x1, win.y1 + offset5);
      ctx.lineTo(win.x2, win.y2 + offset5);
      ctx.stroke();
    });

    // 房間標籤
    floorPlan.rooms.forEach((room) => {
      ctx.font = `${14 / scale}px Arial`;
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.fillText(room.label, room.x, room.y);
    });

    // 尺寸線
    floorPlan.dimensions.forEach((dim) => {
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 0.5 / scale;
      ctx.setLineDash([4 / scale, 4 / scale]);
      ctx.beginPath();
      ctx.moveTo(dim.x1, dim.y1 - 20);
      ctx.lineTo(dim.x2, dim.y2 - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `${11 / scale}px Arial`;
      ctx.fillStyle = "#888";
      ctx.textAlign = "center";
      ctx.fillText(
        `${dim.value}cm`,
        (dim.x1 + dim.x2) / 2,
        (dim.y1 + dim.y2) / 2 - 25
      );
    });

    ctx.restore();
  }, [floorPlan, scale, offset, selectedId]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Canvas 尺寸同步
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    draw();
  }, [draw]);

  const toWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  };

  const hitTestWall = (wx: number, wy: number): Wall | null => {
    for (const wall of floorPlan.walls) {
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const len2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((wx - wall.x1) * dx + (wy - wall.y1) * dy) / len2));
      const px = wall.x1 + t * dx - wx;
      const py = wall.y1 + t * dy - wy;
      if (Math.sqrt(px * px + py * py) < (wall.thickness || 15) / 2 + 5 / scale) {
        return wall;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = toWorld(e.clientX, e.clientY);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const wall = hitTestWall(x, y);
    if (wall) {
      setSelectedId(wall.id);
      setDragging({
        id: wall.id,
        type: "wall",
        startX: x,
        startY: y,
        origX1: wall.x1,
        origY1: wall.y1,
        origX2: wall.x2,
        origY2: wall.y2,
      });
    } else {
      setSelectedId(null);
    }
  };

  // 將牆面端點對齊到最近的 0°/45°/90°/135°
  const snapWall = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x1, y1, x2, y2 };

    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45];
    const closest = snapAngles.reduce((prev, curr) =>
      Math.abs(curr - angleDeg) < Math.abs(prev - angleDeg) ? curr : prev
    );

    const SNAP_THRESHOLD = 8; // 8度以內自動吸附
    if (Math.abs(closest - angleDeg) > SNAP_THRESHOLD) return { x1, y1, x2, y2 };

    const rad = (closest * Math.PI) / 180;
    return {
      x1,
      y1,
      x2: x1 + Math.cos(rad) * len,
      y2: y1 + Math.sin(rad) * len,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset((prev) => ({
        x: prev.x + e.clientX - panStart.x,
        y: prev.y + e.clientY - panStart.y,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (dragging) {
      const { x, y } = toWorld(e.clientX, e.clientY);
      const dx = x - dragging.startX;
      const dy = y - dragging.startY;

      const newX1 = dragging.origX1 + dx;
      const newY1 = dragging.origY1 + dy;
      const newX2 = dragging.origX2 + dx;
      const newY2 = dragging.origY2 + dy;
      const snapped = snapWall(newX1, newY1, newX2, newY2);

      onFloorPlanChange({
        ...floorPlan,
        walls: floorPlan.walls.map((w) =>
          w.id === dragging.id ? { ...w, ...snapped } : w
        ),
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragging(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setScale((prev) => {
      const next = Math.min(Math.max(prev * delta, 0.1), 10);
      setOffset((o) => ({
        x: mx - (mx - o.x) * (next / prev),
        y: my - (my - o.y) * (next / prev),
      }));
      return next;
    });
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#f8f7f4]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: isPanning ? "grabbing" : dragging ? "move" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setScale((s) => Math.min(s * 1.2, 10))}
          className="w-8 h-8 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 flex items-center justify-center text-sm font-bold"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.1))}
          className="w-8 h-8 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 flex items-center justify-center text-sm font-bold"
        >
          −
        </button>
        <span className="text-xs text-stone-400 self-center ml-1">
          {Math.round(scale * 100)}%
        </span>
      </div>
      <div className="absolute top-4 left-4 text-xs text-stone-400">
        滾輪縮放・拖曳牆面微調・Alt+拖曳平移
      </div>
    </div>
  );
}
