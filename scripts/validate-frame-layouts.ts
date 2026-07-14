import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LAYOUT_OVERRIDES } from '../src/client/assets/layoutOverrides';
import { buildFrameRects } from '../src/client/assets/SpriteSheetAnalyzer';

const root = join(process.cwd(), 'public', 'assets');

const sizeOf = (rel: string): { w: number; h: number } => {
  const buf = readFileSync(join(root, rel));
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
};

let failures = 0;

for (const sheet of LAYOUT_OVERRIDES) {
  const { w, h } = sizeOf(sheet.path);
  const issues: string[] = [];

  if (sheet.frameWidth <= 0 || sheet.frameHeight <= 0) {
    issues.push('non-positive frame size');
  }
  if (sheet.columns * sheet.rows !== sheet.frames) {
    issues.push(`frames(${sheet.frames}) != cols*rows(${sheet.columns * sheet.rows})`);
  }

  if (sheet.loadMode === 'spritesheet') {
    if (w % sheet.frameWidth !== 0 || h % sheet.frameHeight !== 0) {
      issues.push(`spritesheet ${sheet.frameWidth}x${sheet.frameHeight} does not divide ${w}x${h}`);
    }
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
      if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > w || rect.y + rect.height > h) {
        issues.push(
          `${rect.name} out of bounds @ (${rect.x},${rect.y},${rect.width}x${rect.height}) tex=${w}x${h}`
        );
        break;
      }
    }
  }

  if (issues.length > 0) {
    failures += 1;
    console.log(`FAIL ${sheet.name}:`, issues.join('; '));
  } else {
    console.log(`OK   ${sheet.name}`);
  }
}

console.log(failures === 0 ? '\nAll frame layouts valid.' : `\n${failures} sheet(s) invalid.`);
process.exit(failures === 0 ? 0 : 1);
