import type { Scene } from 'phaser';
import { AssetManager } from './AssetManager';

export class SpriteSheetNormalizer {
  static normalize(scene: Scene): void {
    const sheets = AssetManager.getSheets();
    const tempCanvas = document.createElement('canvas');

    for (const sheet of sheets) {
      if (sheet.loadMode === 'image') {
        continue;
      }

      if (!scene.textures.exists(sheet.textureKey)) {
        continue;
      }

      const texture = scene.textures.get(sheet.textureKey);
      const sourceImage = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      if (!sourceImage) {
        continue;
      }

      const frameNames: string[] = [];
      for (let i = 0; i < sheet.frames; i++) {
        if (sheet.loadMode === 'grid') {
          if (sheet.emptyFrames.includes(i)) {
            continue;
          }
          frameNames.push(`${sheet.name}_${i}`);
        } else {
          frameNames.push(String(i));
        }
      }

      const boundsList: Array<{
        name: string;
        width: number;
        height: number;
        visualCenterX: number;
        visualCenterY: number;
        hasVisible: boolean;
      }> = [];

      for (const frameName of frameNames) {
        if (!texture.has(frameName)) {
          continue;
        }

        const frameObj = texture.get(frameName);
        tempCanvas.width = frameObj.width;
        tempCanvas.height = frameObj.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          continue;
        }

        ctx.clearRect(0, 0, frameObj.width, frameObj.height);
        ctx.drawImage(
          sourceImage,
          frameObj.cutX,
          frameObj.cutY,
          frameObj.cutWidth,
          frameObj.cutHeight,
          0,
          0,
          frameObj.width,
          frameObj.height
        );

        const imgData = ctx.getImageData(0, 0, frameObj.width, frameObj.height);
        const data = imgData.data;

        let minX = frameObj.width;
        let maxX = 0;
        let minY = frameObj.height;
        let maxY = 0;
        let hasVisible = false;

        for (let y = 0; y < frameObj.height; y++) {
          for (let x = 0; x < frameObj.width; x++) {
            const alpha = data[(y * frameObj.width + x) * 4 + 3];
            if (alpha !== undefined && alpha > 15) {
              hasVisible = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (hasVisible) {
          const visualCenterX = minX + (maxX - minX) / 2;
          const visualCenterY = minY + (maxY - minY) / 2;
          boundsList.push({
            name: frameName,
            width: maxX - minX,
            height: maxY - minY,
            visualCenterX,
            visualCenterY,
            hasVisible: true,
          });
        } else {
          boundsList.push({
            name: frameName,
            width: frameObj.width,
            height: frameObj.height,
            visualCenterX: frameObj.width / 2,
            visualCenterY: frameObj.height / 2,
            hasVisible: false,
          });
        }
      }

      // Identify concept sheets (e.g. composite asset packs like tiles/props)
      // by scanning for high width/height bounds variance across frames.
      const visibleBounds = boundsList.filter((b) => b.hasVisible);
      if (visibleBounds.length > 1) {
        const widths = visibleBounds.map((b) => b.width);
        const heights = visibleBounds.map((b) => b.height);
        const minW = Math.min(...widths);
        const maxW = Math.max(...widths);
        const minH = Math.min(...heights);
        const maxH = Math.max(...heights);

        if (
          (maxW - minW > 80 || maxW - minW > maxW * 0.5) &&
          sheet.name !== 'tiles' &&
          sheet.name !== 'props' &&
          sheet.name !== 'ui_buttons' &&
          sheet.name !== 'ui_icons'
        ) {
          console.warn(
            `[SpriteSheetNormalizer] Sheet "${sheet.name}" is identified as a concept sheet due to high visible bounds variance (Width range: ${minW}px-${maxW}px, Height range: ${minH}px-${maxH}px). Visual normalization skipped.`
          );
          continue;
        }
      }

      // Apply visual centering by overwriting the frame's custom pivot
      for (const item of boundsList) {
        const frameObj = texture.get(item.name);
        frameObj.customPivot = true;
        frameObj.pivotX = item.visualCenterX;
        frameObj.pivotY = item.visualCenterY;
      }
    }
  }
}
