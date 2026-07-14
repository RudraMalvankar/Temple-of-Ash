import { readdirSync, statSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUT_OVERRIDES } from '../src/client/assets/layoutOverrides';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsRoot = join(__dirname, '..', 'public', 'assets');

// Helper to clean up animation name and return descriptive names matching layout
const getDescriptiveName = (sheetName: string, frameIndex: number, anims: any[]): string => {
  for (const anim of anims) {
    if (frameIndex >= anim.start && frameIndex <= anim.end) {
      const idx = frameIndex - anim.start + 1;
      const padIdx = String(idx).padStart(2, '0');
      let cleanName = anim.name;
      if (cleanName.startsWith('particle_')) cleanName = cleanName.replace('particle_', '');
      if (cleanName.startsWith('plate_')) cleanName = cleanName.replace('plate_', 'pressure_plate_');
      return `${cleanName}_${padIdx}`;
    }
  }

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
    if (frameIndex >= 16) {
      const iconIndex = frameIndex - 16;
      const iconNames = [
        'icon_play', 'icon_pause', 'icon_restart', 'icon_close', 'icon_check', 'icon_arrow_left', 'icon_arrow_right',
        'icon_sound_on', 'icon_sound_off', 'icon_music_on', 'icon_music_off', 'icon_star', 'icon_lock', 'icon_unlock',
        'icon_home', 'icon_menu', 'icon_settings', 'icon_info', 'icon_help', 'icon_trophy', 'icon_leaderboard'
      ];
      return iconNames[iconIndex] || `icon_${String(iconIndex + 1).padStart(2, '0')}`;
    }
    const col = frameIndex % 4;
    const row = Math.floor(frameIndex / 4);
    const colorNames = ['green', 'blue', 'yellow', 'red'];
    const stateNames = ['idle', 'hover', 'pressed', 'disabled'];
    const color = colorNames[col] || 'button';
    const state = stateNames[row] || 'state';
    return `button_rectangular_${color}_${state}`;
  }

  if (sheetName === 'ui_icons') {
    const iconNames = [
      'icon_play', 'icon_pause', 'icon_restart', 'icon_close', 'icon_check', 'icon_arrow_left', 'icon_arrow_right',
      'icon_sound_on', 'icon_sound_off', 'icon_music_on', 'icon_music_off', 'icon_star', 'icon_lock', 'icon_unlock',
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

// Map subdirectory names to logical layout sheet names
const mapDirToSheet = (dirPath: string): string | null => {
  const norm = dirPath.replace(/\\/g, '/').toLowerCase();
  
  if (norm.endsWith('/characters')) return 'cube';
  if (norm.endsWith('/doors')) return 'door';
  if (norm.endsWith('/portals')) return 'portal';
  if (norm.endsWith('/props')) return 'props';
  if (norm.endsWith('/tiles')) return 'tiles';
  if (norm.endsWith('/ui')) return 'ui_buttons'; // default fallback for ui
  
  // Interactive subfolders
  if (norm.endsWith('/check point')) return 'checkpoint'; // checkpoint/particles from checkpoint_particles.png
  if (norm.endsWith('/energy beam')) return 'bridge'; // laser_horizontal, laser_vertical, bridge from energy_beam_bridge.png
  if (norm.endsWith('/pillar')) return 'pillar'; // torch/pillar from torch_pillars.png
  if (norm.endsWith('/pressure plate')) return 'pressure_plate'; // pressure_plate/crystal from pressure_plate_crystal.png

  return null;
};

// Recursively traverse directory tree and rename files matching sprite_X.png
const walkAndRename = (currentDir: string) => {
  const files = readdirSync(currentDir);
  const sheetName = mapDirToSheet(currentDir);

  if (sheetName) {
    console.log(`\nScanning Folder: ${currentDir.replace(assetsRoot, '')} (Matched to sheet: ${sheetName})`);
    
    // Find matching sheet overrides
    const sheetDef = LAYOUT_OVERRIDES.find(s => s.name === sheetName);
    const anims = sheetDef?.animations ?? [];

    for (const file of files) {
      const match = file.match(/^sprite_(\d+)\.png$/i);
      if (match) {
        const frameNum = parseInt(match[1], 10);
        const frameIndex = frameNum - 1; // Convert 1-indexed file name to 0-indexed frameIndex
        
        const descriptiveName = getDescriptiveName(sheetName, frameIndex, anims);
        const newFileName = `${descriptiveName}.png`;

        const oldPath = join(currentDir, file);
        const newPath = join(currentDir, newFileName);

        if (oldPath !== newPath && !existsSync(newPath)) {
          console.log(`  Renaming: ${file} -> ${newFileName}`);
          renameSync(oldPath, newPath);
        }
      }
    }
  }

  // Recurse into subdirectories
  for (const file of files) {
    const fullPath = join(currentDir, file);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      walkAndRename(fullPath);
    }
  }
};

const main = () => {
  console.log('Starting Raw Sprite Renaming Pipeline...');
  walkAndRename(assetsRoot);
  console.log('\nRenaming Pipeline completed successfully!');
};

main();
