import type { Scene } from 'phaser';
import { AssetManager } from './AssetManager';

export type ValidationIssue = {
  key: string;
  kind: 'missing_texture' | 'missing_animation' | 'invalid_dimensions' | 'duplicate_key';
  detail: string;
};

export type PipelineValidationReport = {
  assetsLoadedCount: number;
  animationsCreatedCount: number;
  missingAssets: string[];
  missingAnimations: string[];
  invalidDimensions: string[];
  duplicateKeys: string[];
  issues: ValidationIssue[];
  passed: boolean;
};

export const validateAssetPipeline = (scene: Scene): PipelineValidationReport => {
  const staticAssets = AssetManager.getStaticAssets();
  const animAssets = AssetManager.getAnimAssets();

  const missingAssets: string[] = [];
  const missingAnimations: string[] = [];
  const invalidDimensions: string[] = [];
  const duplicateKeys: string[] = [];
  const issues: ValidationIssue[] = [];

  const seenKeys = new Set<string>();
  let assetsLoadedCount = 0;
  let animationsCreatedCount = 0;

  // 1. Validate Static Assets
  for (const asset of staticAssets) {
    if (seenKeys.has(asset.key)) {
      duplicateKeys.push(asset.key);
      issues.push({
        key: asset.key,
        kind: 'duplicate_key',
        detail: `Duplicate static key "${asset.key}" registered.`,
      });
    }
    seenKeys.add(asset.key);

    if (!scene.textures.exists(asset.key)) {
      missingAssets.push(asset.key);
      issues.push({
        key: asset.key,
        kind: 'missing_texture',
        detail: `Static image texture not loaded for key: "${asset.key}". Path: ${asset.path}`,
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
        });
      }
    }
  }

  // 2. Validate Animation Assets
  for (const anim of animAssets) {
    if (seenKeys.has(anim.key)) {
      duplicateKeys.push(anim.key);
      issues.push({
        key: anim.key,
        kind: 'duplicate_key',
        detail: `Duplicate animation key "${anim.key}" registered.`,
      });
    }
    seenKeys.add(anim.key);

    // Verify all frames for the animation sequence are loaded as textures
    let startIndex = 1;
    if (anim.key === 'cube_move') startIndex = 6;
    else if (anim.key === 'cube_jump') startIndex = 11;
    else if (anim.key === 'cube_charged') startIndex = 16;
    else if (anim.key === 'cube_damage') startIndex = 21;
    else if (anim.key === 'cube_destroy') startIndex = 26;

    let animFramesOk = true;
    for (let i = 0; i < anim.frames; i++) {
      const frameIndex = startIndex + i;
      const frameName = `${anim.prefix}${String(frameIndex).padStart(2, '0')}`;
      if (!scene.textures.exists(frameName)) {
        animFramesOk = false;
        missingAssets.push(frameName);
        issues.push({
          key: frameName,
          kind: 'missing_texture',
          detail: `Frame texture "${frameName}" not loaded for animation "${anim.key}".`,
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
          });
        }
      }
    }

    // Verify Phaser animation object exists in cache
    if (!scene.anims.exists(anim.key)) {
      missingAnimations.push(anim.key);
      issues.push({
        key: anim.key,
        kind: 'missing_animation',
        detail: `Phaser animation cache entry missing for animation key: "${anim.key}"`,
      });
    } else if (animFramesOk) {
      animationsCreatedCount++;
    }
  }

  const passed =
    missingAssets.length === 0 &&
    missingAnimations.length === 0 &&
    invalidDimensions.length === 0 &&
    duplicateKeys.length === 0;

  return {
    assetsLoadedCount,
    animationsCreatedCount,
    missingAssets,
    missingAnimations,
    invalidDimensions,
    duplicateKeys,
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

  console.group('[Asset Validation] Static Sprite Pipeline Report');
  mark(
    report.missingAssets.length === 0 && report.assetsLoadedCount > 0,
    'Individual Textures Loaded',
    ` (${report.assetsLoadedCount})`
  );
  mark(
    report.missingAnimations.length === 0 && report.animationsCreatedCount > 0,
    'Animations Registered',
    ` (${report.animationsCreatedCount})`
  );
  mark(report.missingAssets.length === 0, 'Missing Textures', ` (${report.missingAssets.length})`);
  mark(report.missingAnimations.length === 0, 'Missing Animations', ` (${report.missingAnimations.length})`);
  mark(report.invalidDimensions.length === 0, 'Invalid Dimensions', ` (${report.invalidDimensions.length})`);
  mark(report.duplicateKeys.length === 0, 'Duplicate Keys Detected', ` (${report.duplicateKeys.length})`);

  if (report.missingAssets.length > 0) {
    console.error('  Missing files:', report.missingAssets.join(', '));
  }
  if (report.missingAnimations.length > 0) {
    console.error('  Missing animations:', report.missingAnimations.join(', '));
  }
  if (report.invalidDimensions.length > 0) {
    console.error('  Invalid dimensions:', report.invalidDimensions.join(', '));
  }
  if (report.duplicateKeys.length > 0) {
    console.error('  Duplicate keys:', report.duplicateKeys.join(', '));
  }

  console.log(report.passed ? '\nSTATIC PIPELINE VALIDATION PASSED' : '\nVALIDATION FAILED');
  console.groupEnd();
};
