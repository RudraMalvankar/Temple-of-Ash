/**
 * Scans public/assets PNGs, merges curated overrides, writes assets.json.
 * Run: npm run assets:analyze
 */
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUT_OVERRIDES } from '../src/client/assets/layoutOverrides';
import { analyzeSheetDimensions, listPossibleSizes } from '../src/client/assets/SpriteSheetAnalyzer';
import type { AssetSheetDef, AssetsManifest, DetectionReport } from '../src/client/assets/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const assetsRoot = join(repoRoot, 'public', 'assets');

const listPngs = (dir: string, acc: string[] = []): string[] => {
  if (!existsSync(dir)) {
    return acc;
  }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      listPngs(full, acc);
    } else if (extname(entry).toLowerCase() === '.png') {
      acc.push(full);
    }
  }
  return acc;
};

const readPngSize = (filePath: string): { width: number; height: number } => {
  const buf = readFileSync(filePath);
  if (buf.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`Not a PNG: ${filePath}`);
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
};

const main = (): void => {
  const pngs = listPngs(assetsRoot);
  const reports: DetectionReport[] = [];
  const overridePaths = new Set(LAYOUT_OVERRIDES.map((s) => s.path.replace(/\\/g, '/')));

  console.log(`\nScanning ${pngs.length} PNG files under public/assets ...\n`);

  for (const file of pngs) {
    const rel = relative(assetsRoot, file).replace(/\\/g, '/');
    const { width, height } = readPngSize(file);
    const analyzed = analyzeSheetDimensions(rel, width, height);
    const hasOverride = overridePaths.has(rel);

    if (hasOverride) {
      const message = `Curated override present for ${rel} (${width}x${height}). Auto: ${analyzed.message}`;
      reports.push({
        path: rel,
        name: basename(rel, extname(rel)),
        width,
        height,
        status: 'override',
        message,
        possibleSizes: analyzed.possibleSizes,
      });
      console.log(`— ${rel} (${width}x${height})`);
      console.log(`  ${message}`);
      continue;
    }

    reports.push({
      path: rel,
      name: analyzed.name,
      width,
      height,
      status: analyzed.status,
      message: analyzed.message,
      possibleSizes: analyzed.possibleSizes,
    });

    console.log(`— ${rel} (${width}x${height})`);
    if (analyzed.status === 'needs_confirmation') {
      console.warn(rel);
      console.warn('Unable to determine frame size.');
      console.warn('Possible:');
      for (const size of analyzed.possibleSizes.length
        ? analyzed.possibleSizes
        : listPossibleSizes(width, height)) {
        console.warn(`${size.frameWidth}x${size.frameHeight}`);
      }
      console.warn('Needs confirmation.\n');
    } else {
      console.log(`  ${analyzed.message}`);
    }
  }

  const sheets: AssetSheetDef[] = LAYOUT_OVERRIDES.map((sheet) => ({ ...sheet }));

  const manifest: AssetsManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    basePath: 'assets',
    sheets,
    reports,
  };

  mkdirSync(assetsRoot, { recursive: true });
  const outPath = join(assetsRoot, 'assets.json');
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const catalogPath = join(__dirname, 'asset-catalog.json');
  writeFileSync(catalogPath, `${JSON.stringify({ sheets }, null, 2)}\n`, 'utf8');

  console.log(`\nWrote ${outPath}`);
  console.log(`Wrote ${catalogPath}`);
  console.log(`Sheets in catalog: ${sheets.length}`);
  console.log(`Detection reports: ${reports.length}`);
};

main();
