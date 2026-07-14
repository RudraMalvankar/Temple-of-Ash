import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssetManager } from '../src/client/assets/AssetManager';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const assetsRoot = join(repoRoot, 'public', 'assets');

// Helper to scan directory files recursively (case-insensitive checking)
const allFiles: string[] = [];
const scanFiles = (dir: string) => {
  if (!existsSync(dir)) return;
  const items = readdirSync(dir);
  for (const item of items) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      scanFiles(full);
    } else {
      allFiles.push(full.replace(assetsRoot, '').replace(/^[\\/]/, '').replace(/\\/g, '/'));
    }
  }
};
scanFiles(assetsRoot);

const auditList: any[] = [];
const staticAssets = AssetManager.getStaticAssets();
const animAssets = AssetManager.getAnimAssets();

// Static assets checking
for (const asset of staticAssets) {
  const normExpected = asset.path.toLowerCase().replace(/\\/g, '/');
  const matchedDisk = allFiles.find((f) => f.toLowerCase() === normExpected);
  const exists = !!matchedDisk;

  auditList.push({
    key: asset.key,
    expectedPath: asset.path,
    actualPath: matchedDisk || 'NOT FOUND',
    existsOnDisk: exists ? 'YES' : 'NO',
  });
}

// Animation frames checking
for (const anim of animAssets) {
  const frameNums = anim.customFrames || Array.from({ length: anim.frames }, (_, i) => i + 1);
  for (const f of frameNums) {
    const frameName = `${anim.prefix}${String(f).padStart(2, '0')}`;
    const expectedPath = `${anim.subDir}/${frameName}.png`;
    const normExpected = expectedPath.toLowerCase().replace(/\\/g, '/');
    const matchedDisk = allFiles.find((f) => f.toLowerCase() === normExpected);
    const exists = !!matchedDisk;

    auditList.push({
      key: frameName,
      expectedPath: expectedPath,
      actualPath: matchedDisk || 'NOT FOUND',
      existsOnDisk: exists ? 'YES' : 'NO',
    });
  }
}

const failed = auditList.filter((a) => a.existsOnDisk === 'NO');

console.log(JSON.stringify({ totalChecked: auditList.length, failedCount: failed.length, failed }, null, 2));
