export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
}

export interface Window {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Room {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Dimension {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
}

export interface FloorPlan {
  canvas_width: number;
  canvas_height: number;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  dimensions: Dimension[];
}
