import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jimp } from 'jimp';
import { LAYOUT_OVERRIDES } from '../src/client/assets/layoutOverrides';
import { buildFrameRects } from '../src/client/assets/SpriteSheetAnalyzer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const assetsRoot = join(repoRoot, 'public', 'assets');
const outputRoot = join(repoRoot, 'public', 'assets_extracted');

const PADDING = 6; // 4-8px padding

type ExtractedAssetInfo = {
  originalSheet: string;
  category: string;
  name: string;
  fileName: string;
  relativePath: string;
  frameIndex: number;
  width: number;
  height: number;
};

// Map logical categories to clean output folders
const getFolderForCategory = (category: string, name: string): string => {
  switch (category) {
    case 'cube': return 'player';
    case 'door': return 'doors';
    case 'portal': return 'portal';
    case 'torch': return 'torches';
    case 'pillar': return 'pillars';
    case 'bridge': return 'bridges';
    case 'pressure_plate': return 'pressure_plate';
    case 'crystal': return 'crystals';
    case 'checkpoint': return 'checkpoint';
    case 'particles': return 'particles';
    case 'buttons':
    case 'icons':
    case 'ui':
      return 'ui';
    default:
      return category;
  }
};

const getDescriptiveName = (sheetName: string, frameIndex: number, anims: any[]): string => {
  // If the frame index matches an animation frame, use the animation-based name first
  for (const anim of anims) {
    if (frameIndex >= anim.start && frameIndex <= anim.end) {
      const idx = frameIndex - anim.start + 1;
      const padIdx = String(idx).padStart(2, '0');
      // Special case: clean up prefix if it matches
      let cleanName = anim.name;
      if (cleanName.startsWith('particle_')) cleanName = cleanName.replace('particle_', '');
      if (cleanName.startsWith('plate_')) cleanName = cleanName.replace('plate_', 'pressure_plate_');
      return `${cleanName}_${padIdx}`;
    }
  }

  // Custom static naming mappings for unmatched frames
  const padIndex = String(frameIndex + 1).padStart(2, '0');
  
  if (sheetName === 'tiles') {
    if (frameIndex >= 0 && frameIndex <= 11) return `floor_tile_${String(frameIndex + 1).padStart(2, '0')}`;
    if (frameIndex >= 12 && frameIndex <= 23) return `wall_tile_${String(frameIndex - 11).padStart(2, '0')}`;
    if (frameIndex >= 24 && frameIndex <= 35) return `wall_detail_${String(frameIndex - 23).padStart(2, '0')}`;
    if (frameIndex >= 36 && frameIndex <= 47) return `dungeon_structure_${String(frameIndex - 35).padStart(2, '0')}`;
    if (frameIndex >= 54 && frameIndex <= 59) return `lava_fringe_a_${String(frameIndex - 53).padStart(2, '0')}`;
    if (frameIndex >= 66 && frameIndex <= 71) return `lava_fringe_b_${String(frameIndex - 65).padStart(2, '0')}`;
    return `tile_decor_${String(frameIndex - 71).padStart(2, '0')}`;
  }

  if (sheetName === 'props') {
    return `prop_decor_${padIndex}`;
  }

  if (sheetName === 'ui_buttons') {
    const col = frameIndex % 4;
    const row = Math.floor(frameIndex / 4);
    const colorNames = ['green', 'blue', 'yellow', 'red'];
    const stateNames = ['idle', 'hover', 'pressed', 'disabled'];
    const color = colorNames[col] || 'button';
    const state = stateNames[row] || 'state';
    return `button_rectangular_${color}_${state}`;
  }

  if (sheetName === 'ui_icons') {
    // 21 icons: 7 cols x 3 rows
    const iconNames = [
      // Row 0
      'icon_play', 'icon_pause', 'icon_restart', 'icon_close', 'icon_check', 'icon_arrow_left', 'icon_arrow_right',
      // Row 1
      'icon_sound_on', 'icon_sound_off', 'icon_music_on', 'icon_music_off', 'icon_star', 'icon_lock', 'icon_unlock',
      // Row 2
      'icon_home', 'icon_menu', 'icon_settings', 'icon_info', 'icon_help', 'icon_trophy', 'icon_leaderboard'
    ];
    return iconNames[frameIndex] || `icon_${padIndex}`;
  }

  if (sheetName === 'pillar') {
    if (frameIndex < 3) return `pillar_intact_${String(frameIndex + 1).padStart(2, '0')}`;
    return `pillar_broken_${String(frameIndex - 2).padStart(2, '0')}`;
  }

  if (sheetName === 'parallax') {
    const bgNames = ['sky', 'mountains', 'foreground'];
    return `parallax_bg_${bgNames[frameIndex] || padIndex}`;
  }

  if (sheetName === 'effects') {
    const effectNames = ['ambient_glow', 'vignette', 'lens_flare', 'particles_dust'];
    return `effect_${effectNames[frameIndex] || padIndex}`;
  }

  if (sheetName === 'background') {
    return 'bg_main';
  }

  if (sheetName === 'logo') {
    return 'logo_title';
  }

  return `${sheetName}_frame_${padIndex}`;
};

const main = async () => {
  console.log('Starting Asset Extraction Pipeline...');

  if (!existsSync(outputRoot)) {
    mkdirSync(outputRoot, { recursive: true });
  }

  const extractedAssets: ExtractedAssetInfo[] = [];

  for (const sheet of LAYOUT_OVERRIDES) {
    const inputPath = join(assetsRoot, sheet.path);
    if (!existsSync(inputPath)) {
      console.warn(`Original asset sheet not found: ${inputPath}`);
      continue;
    }

    console.log(`\nProcessing Sheet: ${sheet.name} (${sheet.path})`);

    const image = await Jimp.read(inputPath);
    const { width: imgW, height: imgH } = image.bitmap;

    // Build frame coordinates
    const margin = sheet.margin ?? { left: 0, top: 0, right: 0, bottom: 0 };
    const spacing = sheet.spacing ?? { x: 0, y: 0 };
    
    let rects: Array<{ name: string; x: number; y: number; width: number; height: number }> = [];

    if (sheet.loadMode === 'spritesheet') {
      const cols = Math.floor(imgW / sheet.frameWidth);
      const rows = Math.floor(imgH / sheet.frameHeight);
      rects = buildFrameRects({
        columns: cols,
        rows,
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
        prefix: sheet.name,
      });
    } else if (sheet.loadMode === 'grid') {
      rects = buildFrameRects({
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
    } else {
      // Single static image
      rects = [{ name: sheet.name, x: 0, y: 0, width: imgW, height: imgH }];
    }

    const folderName = getFolderForCategory(sheet.category, sheet.name);
    const outputFolder = join(outputRoot, folderName);
    if (!existsSync(outputFolder)) {
      mkdirSync(outputFolder, { recursive: true });
    }

    for (let i = 0; i < rects.length; i++) {
      if (sheet.emptyFrames && sheet.emptyFrames.includes(i)) {
        continue;
      }

      const rect = rects[i];
      if (!rect) continue;

      // Extract raw frame buffer region
      const frameImg = image.clone().crop({
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height
      });

      // Scan for non-transparent boundaries
      let minX = rect.width;
      let maxX = 0;
      let minY = rect.height;
      let maxY = 0;
      let hasVisible = false;

        for (let y = 0; y < rect.height; y++) {
          for (let x = 0; x < rect.width; x++) {
            const color = frameImg.getPixelColor(x, y);
            const alpha = color & 0xff; // Jimp 1.x stores color as 0xRRGGBBAA
            if (alpha > 15) { // alpha threshold 15
              hasVisible = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

      if (!hasVisible) {
        // Skip entirely empty / transparent frames
        continue;
      }

      // Add padding and clamp bounds
      const cropX = Math.max(0, minX - PADDING);
      const cropY = Math.max(0, minY - PADDING);
      const cropW = Math.min(rect.width - cropX, (maxX - minX) + PADDING * 2);
      const cropH = Math.min(rect.height - cropY, (maxY - minY) + PADDING * 2);

      // Crop tightly to visible bounds
      const croppedImg = frameImg.crop({
        x: cropX,
        y: cropY,
        w: cropW,
        h: cropH
      });

      const descriptiveName = getDescriptiveName(sheet.name, i, sheet.animations);
      const outFilename = `${descriptiveName}.png`;
      const outPath = join(outputFolder, outFilename);

      await croppedImg.write(outPath);

      extractedAssets.push({
        originalSheet: sheet.name,
        category: sheet.category,
        name: descriptiveName,
        fileName: outFilename,
        relativePath: `assets_extracted/${folderName}/${outFilename}`,
        frameIndex: i,
        width: cropW,
        height: cropH
      });

      console.log(`  -> Saved: ${folderName}/${outFilename} (${cropW}x${cropH})`);
    }
  }

  // Generate index.json
  const indexPath = join(outputRoot, 'index.json');
  writeFileSync(indexPath, JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    assets: extractedAssets
  }, null, 2), 'utf8');
  console.log(`\nWrote asset index catalog: ${indexPath}`);

  // Generate a beautiful visual contact sheet HTML preview page
  const htmlPath = join(outputRoot, 'preview_contact_sheet.html');
  const groupedHtml: Record<string, string[]> = {};

  for (const asset of extractedAssets) {
    if (!groupedHtml[asset.category]) {
      groupedHtml[asset.category] = [];
    }
    groupedHtml[asset.category].push(`
      <div class="asset-card">
        <div class="image-wrapper">
          <img src="${asset.relativePath.replace('assets_extracted/', './')}" alt="${asset.name}" />
        </div>
        <div class="details">
          <div class="name">${asset.name}</div>
          <div class="size">${asset.width} &times; ${asset.height} px</div>
          <div class="sheet-info">Source: ${asset.originalSheet} (F: ${asset.frameIndex})</div>
        </div>
      </div>
    `);
  }

  const categorySections = Object.entries(groupedHtml).map(([cat, cards]) => `
    <section>
      <h2>Category: ${cat.toUpperCase()}</h2>
      <div class="grid">${cards.join('')}</div>
    </section>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extracted High-Definition Assets Contact Sheet</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: #0f1217;
      color: #e2e8f0;
      margin: 0;
      padding: 32px;
    }
    h1 {
      color: #ff6a1a;
      border-bottom: 2px solid #222933;
      padding-bottom: 12px;
      margin-bottom: 32px;
    }
    h2 {
      color: #3b82f6;
      margin-top: 48px;
      border-left: 4px solid #3b82f6;
      padding-left: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }
    .asset-card {
      background-color: #1a1f28;
      border: 1px solid #2d3748;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      transition: transform 0.2s;
    }
    .asset-card:hover {
      transform: translateY(-4px);
      border-color: #ff6a1a;
    }
    .image-wrapper {
      background-image: 
        linear-gradient(45deg, #12151c 25%, transparent 25%), 
        linear-gradient(-45deg, #12151c 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #12151c 75%), 
        linear-gradient(-45deg, transparent 75%, #12151c 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      background-color: #21252e;
      border: 1px solid #2d3748;
      border-radius: 6px;
      width: 100%;
      height: 140px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .image-wrapper img {
      max-width: 90%;
      max-height: 90%;
      image-rendering: pixelated;
      object-fit: contain;
    }
    .details {
      margin-top: 12px;
      width: 100%;
      text-align: left;
    }
    .name {
      font-weight: bold;
      font-size: 14px;
      color: #f7fafc;
      word-break: break-all;
    }
    .size {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 4px;
    }
    .sheet-info {
      font-size: 10px;
      color: #718096;
      margin-top: 4px;
      border-top: 1px dashed #2d3748;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <h1>Temple of Ash — Extracted Asset Library</h1>
  <p>Generated at: ${new Date().toLocaleString()}</p>
  <p>Total Assets Mapped and Extracted: <strong>${extractedAssets.length} PNGs</strong></p>
  
  ${categorySections}
</body>
</html>
`;
  
  writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`Wrote contact sheet preview HTML page: ${htmlPath}`);
  console.log('Asset Extraction completed successfully!');
};

main().catch((err) => {
  console.error('Error extracting assets:', err);
  process.exit(1);
});
