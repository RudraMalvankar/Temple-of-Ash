import type { Scene } from 'phaser';
import { AssetManager } from './AssetManager';

export type ValidationIssue = {
  sheet: string;
  kind: 'missing_texture' | 'invalid_frame_size';
  detail: string;
};

export type PipelineValidationReport = {
  assetsLoaded: string[];
  missingAssets: string[];
  invalidFrameSizes: string[];
  issues: ValidationIssue[];
  passed: boolean;
};

/**
 * Validates that every catalog sheet has its texture loaded (either as a single image
 * or as all its individual frame images) and that dimensions are valid.
 */
export const validateAssetPipeline = (scene: Scene): PipelineValidationReport => {
  const sheets = AssetManager.getSheets();
  const assetsLoaded: string[] = [];
  const missingAssets: string[] = [];
  const invalidFrameSizes: string[] = [];
  const issues: ValidationIssue[] = [];

  for (const sheet of sheets) {
    if (sheet.loadMode === 'image') {
      if (!scene.textures.exists(sheet.textureKey)) {
        missingAssets.push(sheet.name);
        issues.push({
          sheet: sheet.name,
          kind: 'missing_texture',
          detail: `Texture "${sheet.textureKey}" not loaded (path: ${sheet.path})`,
        });
      } else {
        assetsLoaded.push(sheet.name);
      }
    } else {
      // Individual frames mode: verify every frame image exists in Phaser
      let allFramesLoaded = true;
      for (let i = 0; i < sheet.frames; i += 1) {
        if (sheet.emptyFrames.includes(i)) {
          continue;
        }
        const frameName = AssetManager.getDescriptiveName(sheet.name, i, sheet.animations);
        if (!scene.textures.exists(frameName)) {
          allFramesLoaded = false;
          missingAssets.push(`${sheet.name} (frame ${i})`);
          issues.push({
            sheet: sheet.name,
            kind: 'missing_texture',
            detail: `Frame image "${frameName}" not loaded.`,
          });
        } else {
          // Verify frame texture dimensions are valid (non-zero)
          const texture = scene.textures.get(frameName);
          const source = texture.getSourceImage();
          const width = 'width' in source ? Number(source.width) : 0;
          const height = 'height' in source ? Number(source.height) : 0;
          
          if (width <= 0 || height <= 0) {
            invalidFrameSizes.push(`${sheet.name}: invalid visual dimensions ${width}x${height} for frame "${frameName}"`);
            issues.push({
              sheet: sheet.name,
              kind: 'invalid_frame_size',
              detail: `Frame image "${frameName}" has invalid dimensions ${width}x${height}`,
            });
          }
        }
      }

      if (allFramesLoaded) {
        assetsLoaded.push(sheet.name);
      }
    }
  }

  const passed = missingAssets.length === 0 && invalidFrameSizes.length === 0;

  return {
    assetsLoaded,
    missingAssets,
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

  console.group('[Asset Validation] Static Pipeline Report');
  mark(
    report.missingAssets.length === 0 && report.assetsLoaded.length > 0,
    'Assets Loaded',
    ` (${report.assetsLoaded.length})`
  );
  mark(report.missingAssets.length === 0, 'Missing Assets', ` (${report.missingAssets.length})`);
  mark(
    report.invalidFrameSizes.length === 0,
    'Invalid Frame Sizes',
    ` (${report.invalidFrameSizes.length})`
  );

  if (report.missingAssets.length > 0) {
    console.error('  missing assets:', report.missingAssets.join(', '));
  }
  if (report.invalidFrameSizes.length > 0) {
    for (const item of report.invalidFrameSizes) {
      console.error('  ', item);
    }
  }

  console.log(report.passed ? '\nVALIDATION PASSED' : '\nVALIDATION FAILED');
  console.groupEnd();
};
