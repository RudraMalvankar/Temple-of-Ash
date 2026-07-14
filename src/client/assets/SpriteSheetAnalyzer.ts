import type {
  AnalyzedSheet,
  AnimationDirection,
  DetectionStatus,
} from './types';

const COMMON_FRAME_SIZES = [16, 24, 32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 512] as const;

const classifyName = (fileName: string): string =>
  fileName.replace(/\.[^.]+$/, '').toLowerCase();

const getDivisors = (value: number): number[] => {
  const divisors: number[] = [];
  for (let i = 1; i <= value; i += 1) {
    if (value % i === 0) {
      divisors.push(i);
    }
  }
  return divisors;
};

/**
 * Score a candidate grid. Prefer power-of-two-ish frame sizes and
 * moderate column/row counts typical of animation sheets.
 */
const scoreCandidate = (
  frameWidth: number,
  frameHeight: number,
  columns: number,
  rows: number
): number => {
  let score = 0;

  if (COMMON_FRAME_SIZES.some((size) => size === frameWidth)) {
    score += 4;
  }
  if (COMMON_FRAME_SIZES.some((size) => size === frameHeight)) {
    score += 4;
  }
  if (frameWidth === frameHeight) {
    score += 3;
  }

  if (columns >= 2 && columns <= 16) {
    score += 2;
  }
  if (rows >= 1 && rows <= 16) {
    score += 2;
  }

  // Prefer wider animation strips (horizontal playback).
  if (columns >= rows) {
    score += 1;
  }

  // Soft penalty for tiny or huge frames.
  if (frameWidth < 16 || frameHeight < 16) {
    score -= 5;
  }
  if (frameWidth > 512 || frameHeight > 512) {
    score -= 2;
  }

  return score;
};

export const listPossibleSizes = (
  width: number,
  height: number
): ReadonlyArray<{ frameWidth: number; frameHeight: number }> => {
  const sizes: Array<{ frameWidth: number; frameHeight: number }> = [];
  for (const fw of COMMON_FRAME_SIZES) {
    for (const fh of COMMON_FRAME_SIZES) {
      if (width % fw === 0 && height % fh === 0) {
        sizes.push({ frameWidth: fw, frameHeight: fh });
      }
    }
  }
  return sizes.slice(0, 12);
};

export const detectGrid = (
  width: number,
  height: number
): {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: number;
  direction: AnimationDirection;
  status: DetectionStatus;
  possibleSizes: ReadonlyArray<{ frameWidth: number; frameHeight: number }>;
  message: string;
} => {
  const possibleSizes = listPossibleSizes(width, height);
  const widthDivisors = getDivisors(width).filter((d) => d >= 16 && d <= Math.floor(width / 2));
  const heightDivisors = getDivisors(height).filter((d) => d >= 16 && d <= Math.floor(height / 2));

  let best:
    | {
        frameWidth: number;
        frameHeight: number;
        columns: number;
        rows: number;
        score: number;
      }
    | undefined;

  for (const frameWidth of widthDivisors) {
    for (const frameHeight of heightDivisors) {
      const columns = width / frameWidth;
      const rows = height / frameHeight;
      if (!Number.isInteger(columns) || !Number.isInteger(rows)) {
        continue;
      }
      const score = scoreCandidate(frameWidth, frameHeight, columns, rows);
      if (!best || score > best.score) {
        best = { frameWidth, frameHeight, columns, rows, score };
      }
    }
  }

  if (!best || best.score < 6) {
    return {
      frameWidth: 0,
      frameHeight: 0,
      columns: 0,
      rows: 0,
      frames: 0,
      direction: 'horizontal',
      status: 'needs_confirmation',
      possibleSizes:
        possibleSizes.length > 0
          ? possibleSizes
          : [
              { frameWidth: 64, frameHeight: 64 },
              { frameWidth: 128, frameHeight: 128 },
              { frameWidth: 256, frameHeight: 256 },
            ],
      message:
        'Unable to determine frame size. Possible sizes require confirmation before Phaser spritesheet loading.',
    };
  }

  return {
    frameWidth: best.frameWidth,
    frameHeight: best.frameHeight,
    columns: best.columns,
    rows: best.rows,
    frames: best.columns * best.rows,
    direction: best.columns >= best.rows ? 'horizontal' : 'vertical',
    status: 'detected',
    possibleSizes,
    message: `Detected ${best.columns}x${best.rows} grid @ ${best.frameWidth}x${best.frameHeight}`,
  };
};

export const analyzeSheetDimensions = (
  path: string,
  width: number,
  height: number
): AnalyzedSheet => {
  const name = classifyName(path.split(/[/\\]/).pop() ?? path);
  const detected = detectGrid(width, height);

  return {
    name,
    path,
    width,
    height,
    frameWidth: detected.frameWidth,
    frameHeight: detected.frameHeight,
    columns: detected.columns,
    rows: detected.rows,
    frames: detected.frames,
    emptyFrames: [],
    direction: detected.direction,
    status: detected.status,
    possibleSizes: detected.possibleSizes,
    message: detected.message,
  };
};

/**
 * Infer empty frames by alpha density in each cell.
 * Returns indices where average alpha falls below threshold.
 * When the sheet uses a baked checkerboard (no true alpha), returns [].
 */
export const findEmptyFrames = (
  alphaByFrame: ReadonlyArray<number>,
  threshold = 0.05
): number[] => {
  const empty: number[] = [];
  for (let i = 0; i < alphaByFrame.length; i += 1) {
    const density = alphaByFrame[i];
    if (density !== undefined && density < threshold) {
      empty.push(i);
    }
  }
  return empty;
};

export const buildFrameRects = (options: {
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  marginLeft?: number;
  marginTop?: number;
  spacingX?: number;
  spacingY?: number;
  prefix?: string;
}): Array<{ name: string; x: number; y: number; width: number; height: number }> => {
  const {
    columns,
    rows,
    frameWidth,
    frameHeight,
    marginLeft = 0,
    marginTop = 0,
    spacingX = 0,
    spacingY = 0,
    prefix = 'frame',
  } = options;

  const rects: Array<{ name: string; x: number; y: number; width: number; height: number }> = [];
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      rects.push({
        name: `${prefix}_${index}`,
        x: marginLeft + col * (frameWidth + spacingX),
        y: marginTop + row * (frameHeight + spacingY),
        width: frameWidth,
        height: frameHeight,
      });
      index += 1;
    }
  }
  return rects;
};
