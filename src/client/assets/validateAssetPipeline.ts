import type { Scene } from 'phaser';
import { buildFrameRects } from './SpriteSheetAnalyzer';
import { AssetManager } from './AssetManager';
import type { AssetSheetDef } from './types';

export type ValidationIssue = {
  sheet: string;
  kind: 'missing_texture' | 'missing_animation' | 'invalid_frame_size';
  detail: string;
};

export type PipelineValidationReport = {
  assetsLoaded: string[];
  animationsLoaded: string[];
  missingAssets: string[];
  missingAnimations: string[];
  invalidFrameSizes: string[];
  issues: ValidationIssue[];
  passed: boolean;
};

const textureSize = (scene: Scene, key: string): { width: number; height: number } => {
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage();
  const width = 'width' in source ? Number(source.width) : 0;
  const height = 'height' in source ? Number(source.height) : 0;
  return { width, height };
};

const validateSheetFrames = (
  scene: Scene,
  sheet: AssetSheetDef
): string | undefined => {
  if (sheet.frameWidth <= 0 || sheet.frameHeight <= 0) {
    return `${sheet.name}: non-positive frame size ${sheet.frameWidth}x${sheet.frameHeight}`;
  }

  if (sheet.columns * sheet.rows !== sheet.frames) {
    return `${sheet.name}: frames (${sheet.frames}) != columns*rows (${sheet.columns * sheet.rows})`;
  }

  if (!scene.textures.exists(sheet.textureKey)) {
    return undefined;
  }

  const { width, height } = textureSize(scene, sheet.textureKey);

  if (sheet.loadMode === 'spritesheet') {
    if (width % sheet.frameWidth !== 0 || height % sheet.frameHeight !== 0) {
      return `${sheet.name}: frame ${sheet.frameWidth}x${sheet.frameHeight} does not divide texture ${width}x${height}`;
    }
    return undefined;
  }

  if (sheet.loadMode === 'grid') {
    const margin = sheet.margin ?? { left: 0, top: 0, right: 0, bottom: 0 };
    const spacing = sheet.spacing ?? { x: 0, y: 0 };
    const rects = buildFrameRects({
      columns: sheet.columns,
      rows: sheet.rows,
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
      marginLeft: margin.left,
      marginTop: margin.top,
      spacingX: spacing.x,
      spacingY: spacing.y,
      prefix: sheet.name,
    });

    for (const rect of rects) {
      if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > width || rect.y + rect.height > height) {
        return `${sheet.name}: ${rect.name} out of bounds (${rect.x},${rect.y} ${rect.width}x${rect.height}) on ${width}x${height}`;
      }
    }
  }

  return undefined;
};

/**
 * Validates that every catalog sheet has a loaded texture, declared animations
 * exist, and frame layouts fit the texture.
 */
export const validateAssetPipeline = (scene: Scene): PipelineValidationReport => {
  const sheets = AssetManager.getSheets();
  const assetsLoaded: string[] = [];
  const animationsLoaded: string[] = [];
  const missingAssets: string[] = [];
  const missingAnimations: string[] = [];
  const invalidFrameSizes: string[] = [];
  const issues: ValidationIssue[] = [];

  for (const sheet of sheets) {
    if (!scene.textures.exists(sheet.textureKey)) {
      missingAssets.push(sheet.name);
      issues.push({
        sheet: sheet.name,
        kind: 'missing_texture',
        detail: `Texture "${sheet.textureKey}" not loaded (path: ${sheet.path})`,
      });
    } else {
      assetsLoaded.push(sheet.name);

      if (sheet.loadMode === 'grid') {
        for (let i = 0; i < sheet.frames; i += 1) {
          if (sheet.emptyFrames.includes(i)) {
            continue;
          }
          const frameName = `${sheet.name}_${i}`;
          if (!scene.textures.get(sheet.textureKey).has(frameName)) {
            invalidFrameSizes.push(`${sheet.name}: missing registered frame "${frameName}"`);
            issues.push({
              sheet: sheet.name,
              kind: 'invalid_frame_size',
              detail: `Grid frame "${frameName}" was not registered on texture "${sheet.textureKey}"`,
            });
          }
        }
      }
    }

    const frameIssue = validateSheetFrames(scene, sheet);
    if (frameIssue) {
      invalidFrameSizes.push(frameIssue);
      issues.push({
        sheet: sheet.name,
        kind: 'invalid_frame_size',
        detail: frameIssue,
      });
    }

    for (const anim of sheet.animations) {
      if (!scene.anims.exists(anim.name)) {
        missingAnimations.push(anim.name);
        issues.push({
          sheet: sheet.name,
          kind: 'missing_animation',
          detail: `Animation "${anim.name}" missing for sheet "${sheet.name}"`,
        });
        continue;
      }

      const animation = scene.anims.get(anim.name);
      if (!animation || animation.frames.length === 0) {
        missingAnimations.push(anim.name);
        issues.push({
          sheet: sheet.name,
          kind: 'missing_animation',
          detail: `Animation "${anim.name}" has zero frames`,
        });
        continue;
      }

      animationsLoaded.push(anim.name);
    }
  }

  const passed =
    missingAssets.length === 0 &&
    missingAnimations.length === 0 &&
    invalidFrameSizes.length === 0 &&
    assetsLoaded.length === sheets.length;

  return {
    assetsLoaded,
    animationsLoaded,
    missingAssets,
    missingAnimations,
    invalidFrameSizes,
    issues,
    passed,
  };
};

export const printPipelineReport = (report: PipelineValidationReport): void => {
  const ok = (label: string, detail: string) => console.log(`✓ ${label}${detail}`);
  const bad = (label: string, detail: string) => console.error(`✗ ${label}${detail}`);

  const mark = (pass: boolean, label: string, detail: string) => {
    if (pass) {
      ok(label, detail);
    } else {
      bad(label, detail);
    }
  };

  console.group('[Asset Validation] Pipeline Report');
  mark(
    report.missingAssets.length === 0 && report.assetsLoaded.length > 0,
    'Assets Loaded',
    ` (${report.assetsLoaded.length})`
  );
  mark(
    report.missingAnimations.length === 0,
    'Animations Loaded',
    ` (${report.animationsLoaded.length})`
  );
  mark(report.missingAssets.length === 0, 'Missing Assets', ` (${report.missingAssets.length})`);
  mark(
    report.missingAnimations.length === 0,
    'Missing Animations',
    ` (${report.missingAnimations.length})`
  );
  mark(
    report.invalidFrameSizes.length === 0,
    'Invalid Frame Sizes',
    ` (${report.invalidFrameSizes.length})`
  );

  if (report.missingAssets.length > 0) {
    console.error('  missing assets:', report.missingAssets.join(', '));
  }
  if (report.missingAnimations.length > 0) {
    console.error('  missing animations:', report.missingAnimations.join(', '));
  }
  if (report.invalidFrameSizes.length > 0) {
    for (const item of report.invalidFrameSizes) {
      console.error('  ', item);
    }
  }

  console.log(report.passed ? '\nVALIDATION PASSED' : '\nVALIDATION FAILED');
  console.groupEnd();
};
