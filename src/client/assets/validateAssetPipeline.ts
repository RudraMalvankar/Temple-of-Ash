import type { Scene } from 'phaser';
import { AssetManager } from './AssetManager';

export type ValidationIssue = {
  key: string;
  kind: 'missing_texture' | 'missing_animation' | 'invalid_dimensions' | 'duplicate_key';
  detail: string;
  required: boolean;
};

export type PipelineValidationReport = {
  assetsLoadedCount: number;
  missingRequiredAssets: string[];
  missingOptionalAssets: string[];
  invalidDimensions: string[];
  duplicateKeys: string[];
  issues: ValidationIssue[];
  passed: boolean;
};

export const isRequiredAsset = (key: string, category: string): boolean => {
  if (key === 'bg_main') return true;
  if (key === 'player_cube') return true;
  if (category === 'TILES') {
    if (key.startsWith('floor_tile_') || key.startsWith('wall_tile_')) return true;
  }
  if (category === 'CHARACTERS') return true;
  if (category === 'PORTALS') return true;
  if (category === 'DOORS') return true;
  if (category === 'PRESSURE_PLATES') return true;
  if (category === 'BRIDGES') return true;
  if (category === 'CHECKPOINTS') return true;
  return false;
};

export const validateAssetPipeline = (scene: Scene): PipelineValidationReport => {
  const staticAssets = AssetManager.getStaticAssets();
  const animAssets = AssetManager.getAnimAssets();

  const missingRequiredAssets: string[] = [];
  const missingOptionalAssets: string[] = [];
  const invalidDimensions: string[] = [];
  const duplicateKeys: string[] = [];
  const issues: ValidationIssue[] = [];

  const seenKeys = new Set<string>();
  let assetsLoadedCount = 0;

  // 1. Validate Static Assets
  for (const asset of staticAssets) {
    const required = isRequiredAsset(asset.key, asset.category);

    if (seenKeys.has(asset.key)) {
      duplicateKeys.push(asset.key);
      issues.push({
        key: asset.key,
        kind: 'duplicate_key',
        detail: `Duplicate static key "${asset.key}" registered.`,
        required,
      });
    }
    seenKeys.add(asset.key);

    if (!scene.textures.exists(asset.key)) {
      if (required) {
        missingRequiredAssets.push(asset.key);
      } else {
        missingOptionalAssets.push(asset.key);
      }
      issues.push({
        key: asset.key,
        kind: 'missing_texture',
        detail: `Static texture missing for key: "${asset.key}".`,
        required,
      });
    } else {
      assetsLoadedCount++;
      const texture = scene.textures.get(asset.key);
      const source = texture.getSourceImage();
      const width = 'width' in source ? Number(source.width) : 0;
      const height = 'height' in source ? Number(source.height) : 0;

      if (width <= 0 || height <= 0) {
        invalidDimensions.push(`${asset.key} (${width}x${height})`);
        issues.push({
          key: asset.key,
          kind: 'invalid_dimensions',
          detail: `Static image "${asset.key}" has invalid dimensions: ${width}x${height}`,
          required,
        });
      }
    }
  }

  // 2. Validate Animation Assets
  for (const anim of animAssets) {
    const required = isRequiredAsset(anim.key, anim.category);

    if (seenKeys.has(anim.key)) {
      duplicateKeys.push(anim.key);
      issues.push({
        key: anim.key,
        kind: 'duplicate_key',
        detail: `Duplicate animation key "${anim.key}" registered.`,
        required,
      });
    }
    seenKeys.add(anim.key);

    const frameNums = anim.customFrames || Array.from({ length: anim.frames }, (_, i) => i + 1);

    for (const f of frameNums) {
      const frameName = `${anim.prefix}${String(f).padStart(2, '0')}`;
      if (!scene.textures.exists(frameName)) {
        if (required) {
          missingRequiredAssets.push(frameName);
        } else {
          missingOptionalAssets.push(frameName);
        }
        issues.push({
          key: frameName,
          kind: 'missing_texture',
          detail: `Frame texture "${frameName}" not loaded for animation "${anim.key}".`,
          required,
        });
      } else {
        assetsLoadedCount++;
        const texture = scene.textures.get(frameName);
        const source = texture.getSourceImage();
        const width = 'width' in source ? Number(source.width) : 0;
        const height = 'height' in source ? Number(source.height) : 0;

        if (width <= 0 || height <= 0) {
          invalidDimensions.push(`${frameName} (${width}x${height})`);
          issues.push({
            key: frameName,
            kind: 'invalid_dimensions',
            detail: `Frame image "${frameName}" has invalid dimensions: ${width}x${height}`,
            required,
          });
        }
      }
    }

    if (!scene.anims.exists(anim.key) && required) {
      issues.push({
        key: anim.key,
        kind: 'missing_animation',
        detail: `Phaser animation cache entry missing for animation key: "${anim.key}"`,
        required,
      });
    }
  }

  // The validation only fails if required assets are missing
  const passed = missingRequiredAssets.length === 0;

  return {
    assetsLoadedCount,
    missingRequiredAssets,
    missingOptionalAssets,
    invalidDimensions,
    duplicateKeys,
    issues,
    passed,
  };
};

export const printPipelineReport = (report: PipelineValidationReport): void => {
  const ok = (label: string, detail: string) => console.log(`✓ ${label}${detail}`);
  const warn = (label: string, detail: string) => console.warn(`⚠ ${label}${detail}`);
  const bad = (label: string, detail: string) => console.error(`✗ ${label}${detail}`);

  console.group('[Asset Validation] Graceful Pipeline Report');
  console.log(`Assets loaded successfully: ${report.assetsLoadedCount}`);
  
  if (report.missingRequiredAssets.length === 0) {
    ok('Required Assets Checked', ' (All present)');
  } else {
    bad('Missing Required Assets', ` (${report.missingRequiredAssets.length} missing)`);
    console.error('  Missing required:', report.missingRequiredAssets.join(', '));
  }

  if (report.missingOptionalAssets.length > 0) {
    warn('Skipped Optional Assets', ` (${report.missingOptionalAssets.length} skipped)`);
    console.info('  Missing optional:', report.missingOptionalAssets.join(', '));
  }

  console.log(report.passed ? '\nGRACEFUL VALIDATION PASSED' : '\nGRACEFUL VALIDATION FAILED');
  console.groupEnd();
};
