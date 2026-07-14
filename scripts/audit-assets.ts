import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jimp } from 'jimp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const assetsRoot = join(repoRoot, 'public', 'assets');

type AssetRecord = {
  filename: string;
  relativePath: string;
  extension: string;
  width: number;
  height: number;
  type: string;
};

const getAssetType = (relPath: string, filename: string): string => {
  const norm = relPath.toLowerCase().replace(/\\/g, '/');
  
  if (norm.includes('backgrounds/') || norm.includes('background/')) return 'background';
  if (norm.includes('characters/')) {
    if (filename.includes('shadow')) return 'player shadow';
    if (filename.includes('glow')) return 'player glow';
    return 'character';
  }
  if (norm.includes('effects/') || norm.includes('particles/')) return 'effect/particle';
  
  // Interactive / gameplay items
  if (norm.includes('interactive/')) {
    if (norm.includes('check point')) return 'checkpoint';
    if (norm.includes('energy beam')) {
      if (filename.includes('bridge')) return 'bridge';
      if (filename.includes('laser')) return 'laser';
    }
    if (norm.includes('pillar')) {
      if (filename.includes('torch')) return 'torch';
      return 'pillar';
    }
    if (norm.includes('pressure plate')) {
      if (filename.includes('crystal')) return 'crystal';
      return 'pressure plate';
    }
  }

  if (norm.includes('portals/')) return 'portal';
  if (norm.includes('doors/')) return 'door';
  if (norm.includes('props/')) return 'prop/decoration';
  if (norm.includes('tiles/')) {
    if (filename.includes('floor')) return 'floor tile';
    if (filename.includes('wall')) return 'wall tile';
    if (filename.includes('lava')) return 'lava';
    return 'world tile';
  }
  if (norm.includes('ui/')) {
    if (filename.includes('button')) return 'ui button';
    if (filename.includes('icon')) return 'ui icon';
    if (filename.includes('logo')) return 'ui logo';
    return 'ui element';
  }

  return 'unknown';
};

const walk = async (currentDir: string, list: AssetRecord[] = []): Promise<AssetRecord[]> => {
  const files = readdirSync(currentDir);
  for (const file of files) {
    const fullPath = join(currentDir, file);
    if (statSync(fullPath).isDirectory()) {
      await walk(fullPath, list);
    } else if (extname(file).toLowerCase() === '.png') {
      try {
        const image = await Jimp.read(fullPath);
        const relPath = fullPath.replace(assetsRoot, '').replace(/^[\\/]/, '');
        list.push({
          filename: file,
          relativePath: `assets/${relPath.replace(/\\/g, '/')}`,
          extension: '.png',
          width: image.bitmap.width,
          height: image.bitmap.height,
          type: getAssetType(relPath, file)
        });
      } catch (err) {
        console.error(`Error reading ${file}:`, err);
      }
    }
  }
  return list;
};

const main = async () => {
  console.log('Auditing assets folder...');
  const catalog = await walk(assetsRoot);
  const outputPath = join(repoRoot, 'scripts', 'assets-audit-report.json');
  writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Audit complete. Catalog saved to ${outputPath}`);
  console.log(`Total PNG Assets: ${catalog.length}`);
};

main();
