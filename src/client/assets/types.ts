import type { AssetCategoryId } from './AssetCategory';

export type AnimationDirection = 'horizontal' | 'vertical';

export type LoadMode = 'spritesheet' | 'grid' | 'image';

export type DetectionStatus = 'detected' | 'override' | 'needs_confirmation' | 'image_only';

export type FrameRect = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnimationDef = {
  name: string;
  start: number;
  end: number;
  fps: number;
  repeat: number;
};

export type Margin = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type Spacing = {
  x: number;
  y: number;
};

/**
 * Logical game asset (may share a texture file with siblings).
 */
export type AssetSheetDef = {
  name: string;
  /** Relative path from /assets */
  path: string;
  category: AssetCategoryId;
  textureKey: string;
  loadMode: LoadMode;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: number;
  emptyFrames: number[];
  direction: AnimationDirection;
  detectionStatus: DetectionStatus;
  animations: AnimationDef[];
  /** Used by loadMode "grid" to carve frames without cropping the PNG. */
  margin?: Margin;
  spacing?: Spacing;
  /** Extra note printed in reports. */
  notes?: string;
  /** Candidate sizes when detection fails. */
  possibleSizes?: ReadonlyArray<{ frameWidth: number; frameHeight: number }>;
};

export type DetectionReport = {
  path: string;
  name: string;
  width: number;
  height: number;
  status: DetectionStatus;
  message: string;
  possibleSizes: ReadonlyArray<{ frameWidth: number; frameHeight: number }>;
};

export type AssetsManifest = {
  version: number;
  generatedAt: string;
  basePath: string;
  sheets: AssetSheetDef[];
  reports: DetectionReport[];
};

export type AnalyzedSheet = {
  name: string;
  path: string;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: number;
  emptyFrames: number[];
  direction: AnimationDirection;
  status: DetectionStatus;
  possibleSizes: ReadonlyArray<{ frameWidth: number; frameHeight: number }>;
  message: string;
};
