import type { Scene, GameObjects } from 'phaser';

const ASSET_BASE = 'assets';

export type AssetCategory =
  | 'BACKGROUND'
  | 'CHARACTERS'
  | 'DOORS'
  | 'PORTALS'
  | 'CHECKPOINTS'
  | 'PRESSURE_PLATES'
  | 'CRYSTALS'
  | 'TORCHES'
  | 'PILLARS'
  | 'BRIDGES'
  | 'LASERS'
  | 'PARTICLES'
  | 'PROPS'
  | 'TILES'
  | 'LAVA'
  | 'UI';

type StaticAssetDef = {
  key: string;
  path: string;
  category: AssetCategory;
};

type AnimAssetDef = {
  key: string;
  category: AssetCategory;
  prefix: string;
  subDir: string;
  frames: number;
  fps: number;
  repeat: number;
  customFrames?: number[]; // Explicit frame numbers to load if non-contiguous
};

// ---------------------------------------------------------
// Static Assets Manifest (audited files)
// ---------------------------------------------------------
const STATIC_ASSETS: StaticAssetDef[] = [
  // Backgrounds
  { key: 'bg_main', path: 'backgrounds/bg.png', category: 'BACKGROUND' },
  { key: 'parallax_backgrounds', path: 'backgrounds/parallax_backgrounds.png', category: 'BACKGROUND' },

  // Characters
  { key: 'player_cube', path: 'characters/player_cube.png', category: 'CHARACTERS' },

  // Interactive Pillars
  { key: 'pillar_idle_01', path: 'interactive/Pillar/pillar_idle_01.png', category: 'PILLARS' },
  { key: 'pillar_intact_02', path: 'interactive/Pillar/pillar_intact_02.png', category: 'PILLARS' },
  { key: 'pillar_intact_03', path: 'interactive/Pillar/pillar_intact_03.png', category: 'PILLARS' },
  // Broken pillars
  ...Array.from({ length: 13 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      key: `pillar_broken_${num}`,
      path: `interactive/Pillar/pillar_broken_${num}.png`,
      category: 'PILLARS' as AssetCategory,
    };
  }),

  // Props
  { key: 'props_idle_01', path: 'props/props_idle_01.png', category: 'PROPS' },
  ...Array.from({ length: 52 }, (_, i) => {
    const num = String(i + 2).padStart(2, '0');
    return {
      key: `prop_decor_${num}`,
      path: `props/prop_decor_${num}.png`,
      category: 'PROPS' as AssetCategory,
    };
  }),

  // Tiles
  ...Array.from({ length: 12 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return [
      { key: `floor_tile_${num}`, path: `tiles/floor_tile_${num}.png`, category: 'TILES' as AssetCategory },
      { key: `wall_tile_${num}`, path: `tiles/wall_tile_${num}.png`, category: 'TILES' as AssetCategory },
      { key: `wall_detail_${num}`, path: `tiles/wall_detail_${num}.png`, category: 'TILES' as AssetCategory },
      { key: `dungeon_structure_${num}`, path: `tiles/dungeon_structure_${num}.png`, category: 'TILES' as AssetCategory },
    ];
  }).flat(),

  // UI button elements
  { key: 'button_idle_01', path: 'ui/button_idle_01.png', category: 'UI' },
  { key: 'button_hover_01', path: 'ui/button_hover_01.png', category: 'UI' },
  { key: 'button_pressed_01', path: 'ui/button_pressed_01.png', category: 'UI' },
  { key: 'button_disabled_01', path: 'ui/button_disabled_01.png', category: 'UI' },
  
  // Blue, Yellow, Red rectangular button states
  ...['blue', 'yellow', 'red'].flatMap((color) =>
    ['idle', 'hover', 'pressed', 'disabled', 'state'].map((state) => ({
      key: `button_rectangular_${color}_${state}`,
      path: `ui/button_rectangular_${color}_${state}.png`,
      category: 'UI' as AssetCategory,
    }))
  ),
  // Green rectangular state only
  { key: 'button_rectangular_green_state', path: 'ui/button_rectangular_green_state.png', category: 'UI' },

  // UI Icon elements (verified exists on disk)
  ...[
    'arrow_left', 'arrow_right', 'check', 'help', 'home', 'info', 'leaderboard',
    'lock', 'menu', 'music_off', 'music_on', 'settings', 'sound_off', 'sound_on',
    'star', 'trophy', 'unlock'
  ].map((name) => ({
    key: `icon_${name}`,
    path: `ui/icon_${name}.png`,
    category: 'UI' as AssetCategory,
  })),

  // UI Logo (verified file logo.png exists)
  { key: 'logo_title', path: 'ui/logo.png', category: 'UI' },

  // Effects static overlays (verified file effects_overlays.png exists)
  { key: 'effects_overlays', path: 'effects/effects_overlays.png', category: 'UI' },
];

// ---------------------------------------------------------
// Animation Sequence Assets Manifest
// ---------------------------------------------------------
const ANIM_ASSETS: AnimAssetDef[] = [
  // Player Animations
  { key: 'cube_idle', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, customFrames: [1, 2, 3, 4, 5], fps: 6, repeat: -1 },
  { key: 'cube_move', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, customFrames: [6, 7, 8, 9, 10], fps: 10, repeat: -1 },
  { key: 'cube_jump', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, customFrames: [11, 12, 13, 14, 15], fps: 10, repeat: 0 },
  { key: 'cube_charged', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, customFrames: [16, 17, 18, 19, 20], fps: 8, repeat: -1 },
  { key: 'cube_damage', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, customFrames: [21, 22, 23, 24, 25], fps: 8, repeat: 0 },
  { key: 'cube_destroy', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 4, customFrames: [26, 27, 28, 29], fps: 8, repeat: 0 },

  // Doors
  { key: 'door_closed', category: 'DOORS', prefix: 'door_closed_', subDir: 'doors', frames: 5, customFrames: [1, 2, 3, 4, 5], fps: 6, repeat: -1 },
  { key: 'door_opening', category: 'DOORS', prefix: 'door_opening_', subDir: 'doors', frames: 5, customFrames: [1, 2, 3, 4, 5], fps: 10, repeat: 0 },
  { key: 'door_open', category: 'DOORS', prefix: 'door_open_', subDir: 'doors', frames: 5, customFrames: [1, 2, 3, 4, 5], fps: 6, repeat: -1 },

  // Portals
  { key: 'portal_idle', category: 'PORTALS', prefix: 'portal_idle_', subDir: 'portals', frames: 2, customFrames: [1, 2], fps: 4, repeat: -1 },
  { key: 'portal_activate', category: 'PORTALS', prefix: 'portal_activate_', subDir: 'portals', frames: 2, customFrames: [1, 2], fps: 8, repeat: 0 },

  // Checkpoints (inactive prefix checkpoint_idle_, active prefix checkpoint_activated_)
  { key: 'checkpoint_inactive', category: 'CHECKPOINTS', prefix: 'checkpoint_idle_', subDir: 'interactive/Check Point', frames: 3, customFrames: [1, 2, 3], fps: 6, repeat: -1 },
  { key: 'checkpoint_active', category: 'CHECKPOINTS', prefix: 'checkpoint_activated_', subDir: 'interactive/Check Point', frames: 3, customFrames: [1, 2, 3], fps: 8, repeat: -1 },

  // Particles
  { key: 'particle_ember', category: 'PARTICLES', prefix: 'checkpoint_frame_', subDir: 'interactive/Check Point', frames: 6, customFrames: [7, 8, 9, 10, 11, 12], fps: 10, repeat: -1 },
  { key: 'particle_spark', category: 'PARTICLES', prefix: 'checkpoint_frame_', subDir: 'interactive/Check Point', frames: 6, customFrames: [13, 14, 15, 16, 17, 18], fps: 12, repeat: -1 },
  { key: 'particle_dust', category: 'PARTICLES', prefix: 'checkpoint_frame_', subDir: 'interactive/Check Point', frames: 6, customFrames: [19, 20, 21, 22, 23, 24], fps: 8, repeat: -1 },
  { key: 'particle_smoke', category: 'PARTICLES', prefix: 'checkpoint_frame_', subDir: 'interactive/Check Point', frames: 4, customFrames: [25, 26, 27, 28], fps: 8, repeat: -1 },
  { key: 'particle_sparkle', category: 'PARTICLES', prefix: 'checkpoint_frame_', subDir: 'interactive/Check Point', frames: 8, customFrames: [32, 33, 34, 35, 36, 37, 38, 39], fps: 12, repeat: -1 },

  // Bridges
  { key: 'bridge_lowered', category: 'BRIDGES', prefix: 'bridge_lowered_', subDir: 'interactive/Energy Beam', frames: 3, customFrames: [1, 2, 3], fps: 6, repeat: -1 },
  { key: 'bridge_raising', category: 'BRIDGES', prefix: 'bridge_raising_', subDir: 'interactive/Energy Beam', frames: 3, customFrames: [1, 2, 3], fps: 10, repeat: 0 },
  { key: 'bridge_raised', category: 'BRIDGES', prefix: 'bridge_raised_', subDir: 'interactive/Energy Beam', frames: 3, customFrames: [1, 2, 3], fps: 6, repeat: -1 },

  // Lasers
  { key: 'laser_horizontal', category: 'LASERS', prefix: 'bridge_frame_', subDir: 'interactive/Energy Beam', frames: 4, customFrames: [10, 11, 12, 13], fps: 8, repeat: -1 },
  { key: 'laser_vertical', category: 'LASERS', prefix: 'bridge_frame_', subDir: 'interactive/Energy Beam', frames: 5, customFrames: [14, 15, 16, 17, 18], fps: 8, repeat: -1 },

  // Torches
  { key: 'torch_idle', category: 'TORCHES', prefix: 'checkpoint_frame_', subDir: 'interactive/Check Point', frames: 3, customFrames: [29, 30, 31], fps: 8, repeat: -1 },
  { key: 'torch_extinguish', category: 'TORCHES', prefix: 'pressure_plate_frame_', subDir: 'interactive/Pressure Plate', frames: 3, customFrames: [18, 19, 20], fps: 8, repeat: 0 },

  // Pressure Plates
  { key: 'pressure_plate_idle', category: 'PRESSURE_PLATES', prefix: 'pressure_plate_idle_', subDir: 'interactive/Pressure Plate', frames: 4, customFrames: [1, 2, 3, 4], fps: 6, repeat: -1 },
  { key: 'pressure_plate_pressed', category: 'PRESSURE_PLATES', prefix: 'pressure_plate_pressed_', subDir: 'interactive/Pressure Plate', frames: 3, customFrames: [1, 2, 3], fps: 10, repeat: 0 },
  { key: 'pressure_plate_activated', category: 'PRESSURE_PLATES', prefix: 'pressure_plate_activated_', subDir: 'interactive/Pressure Plate', frames: 3, customFrames: [1, 2, 3], fps: 8, repeat: -1 },

  // Crystals (skipping missing frames 9, 10, 11)
  { key: 'crystal_idle', category: 'CRYSTALS', prefix: 'pressure_plate_frame_', subDir: 'interactive/Pressure Plate', frames: 2, customFrames: [8, 12], fps: 6, repeat: -1 },
  { key: 'crystal_active', category: 'CRYSTALS', prefix: 'pressure_plate_frame_', subDir: 'interactive/Pressure Plate', frames: 5, customFrames: [13, 14, 15, 16, 17], fps: 8, repeat: -1 },

  // Lava (only flow a exists on disk with 2 frames)
  { key: 'lava_flow_a', category: 'LAVA', prefix: 'lava_flow_a_', subDir: 'tiles', frames: 2, customFrames: [1, 2], fps: 6, repeat: -1 },
];

export class AssetManager {
  private static scene: Scene | undefined;
  private static animationsReady = false;

  static loadAssets(scene: Scene): void {
    AssetManager.scene = scene;

    // Load static assets
    for (const asset of STATIC_ASSETS) {
      if (!scene.textures.exists(asset.key)) {
        scene.load.image(asset.key, `${ASSET_BASE}/${asset.path}`);
      }
    }

    // Load animation sequence assets
    for (const anim of ANIM_ASSETS) {
      const frameNums = anim.customFrames || Array.from({ length: anim.frames }, (_, i) => i + 1);
      for (const f of frameNums) {
        const frameName = `${anim.prefix}${String(f).padStart(2, '0')}`;
        const path = `${anim.subDir}/${frameName}.png`;
        if (!scene.textures.exists(frameName)) {
          scene.load.image(frameName, `${ASSET_BASE}/${path}`);
        }
      }
    }
  }

  static createAnimations(scene: Scene): void {
    AssetManager.scene = scene;

    for (const anim of ANIM_ASSETS) {
      if (scene.anims.exists(anim.key)) {
        continue;
      }

      const frames: Array<{ key: string }> = [];
      const frameNums = anim.customFrames || Array.from({ length: anim.frames }, (_, i) => i + 1);
      for (const f of frameNums) {
        const frameName = `${anim.prefix}${String(f).padStart(2, '0')}`;
        frames.push({ key: frameName });
      }

      scene.anims.create({
        key: anim.key,
        frames: frames,
        frameRate: anim.fps,
        repeat: anim.repeat,
      });
    }

    AssetManager.animationsReady = true;
  }

  static getStaticAssets(): readonly StaticAssetDef[] {
    return STATIC_ASSETS;
  }

  static getAnimAssets(): readonly AnimAssetDef[] {
    return ANIM_ASSETS;
  }

  static getDescriptiveName(sheetName: string, frameIndex: number, _anims: any[]): string {
    return `${sheetName}_frame_${String(frameIndex).padStart(2, '0')}`;
  }

  static getSheet(name: string) {
    if (name === 'cube') {
      return { textureKey: 'cube_frame_01' };
    }
    const s = STATIC_ASSETS.find(a => a.key === name);
    if (s) return { textureKey: s.key };
    const a = ANIM_ASSETS.find(am => am.key === name);
    if (a) {
      const firstFrame = a.customFrames ? a.customFrames[0] : 1;
      return { textureKey: a.prefix + String(firstFrame).padStart(2, '0') };
    }
    return { textureKey: name };
  }

  static playAnimation(sprite: GameObjects.Sprite, name: string): GameObjects.Sprite {
    if (sprite.anims) {
      sprite.anims.play(name, true);
    }
    return sprite;
  }

  // ---------------------------------------------------------
  // Play Helpers for legacy bindings
  // ---------------------------------------------------------
  static playCube(sprite: GameObjects.Sprite, state: string): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `cube_${state}`);
  }

  static playDoor(sprite: GameObjects.Sprite, state: string): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `door_${state}`);
  }

  static playPortal(sprite: GameObjects.Sprite, state: string): GameObjects.Sprite {
    const key = state === 'idle' ? 'portal_idle' : 'portal_activate';
    return AssetManager.playAnimation(sprite, key);
  }

  static playTorch(sprite: GameObjects.Sprite): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, 'torch_idle');
  }

  static playPressurePlate(sprite: GameObjects.Sprite, _state: string): GameObjects.Sprite {
    return sprite;
  }

  static playCrystal(sprite: GameObjects.Sprite, activated = false): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, activated ? 'crystal_active' : 'crystal_idle');
  }

  static playCheckpoint(sprite: GameObjects.Sprite, activated = false): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, activated ? 'checkpoint_active' : 'checkpoint_inactive');
  }

  // ---------------------------------------------------------
  // Legacy creation helpers mapped to dynamic spawners
  // ---------------------------------------------------------
  static createTile(x: number, y: number, frameIndex = 0, scene = AssetManager.requireScene()): GameObjects.Sprite {
    if (frameIndex === 12) return AssetManager.spawnWallTile(scene, x, y);
    return AssetManager.spawnFloorTile(scene, x, y);
  }

  static createTorch(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnTorch(scene, x, y);
  }

  static createPortal(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnPortal(scene, x, y);
  }

  static createDoor(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnDoor(scene, x, y);
  }

  static createPressurePlate(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnPressurePlate(scene, x, y);
  }

  static createCrystal(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnCrystal(scene, x, y);
  }

  static createCube(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnCube(scene, x, y);
  }

  static createBridge(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnBridge(scene, x, y);
  }

  static createPillar(x: number, y: number, _variant = 0, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnPillar(scene, x, y);
  }

  static createProp(x: number, y: number, _variant = 0, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnProp(scene, x, y);
  }

  // ---------------------------------------------------------
  // Strongly Typed Spawning Helpers
  // ---------------------------------------------------------

  static spawnPlayer(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'cube_frame_01');
    AssetManager.playAnimation(sprite, 'cube_idle');
    return sprite;
  }

  static spawnCube(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'prop_decor_03');
    return sprite;
  }

  static spawnDoor(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'door_closed_01');
    AssetManager.playAnimation(sprite, 'door_closed');
    return sprite;
  }

  static spawnPortal(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'portal_idle_01');
    AssetManager.playAnimation(sprite, 'portal_idle');
    return sprite;
  }

  static spawnCheckpoint(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'checkpoint_idle_01');
    AssetManager.playAnimation(sprite, 'checkpoint_inactive');
    return sprite;
  }

  static spawnPressurePlate(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'prop_decor_40');
    return sprite;
  }

  static spawnCrystal(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'pressure_plate_frame_08');
    AssetManager.playAnimation(sprite, 'crystal_idle');
    return sprite;
  }

  static spawnTorch(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'checkpoint_frame_29');
    AssetManager.playAnimation(sprite, 'torch_idle');
    return sprite;
  }

  static spawnBridge(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'bridge_lowered_01');
    AssetManager.playAnimation(sprite, 'bridge_lowered');
    return sprite;
  }

  static spawnLaser(scene: Scene, x: number, y: number, orientation: 'horizontal' | 'vertical'): GameObjects.Sprite {
    const frame = orientation === 'horizontal' ? 'bridge_frame_10' : 'bridge_frame_14';
    const anim = orientation === 'horizontal' ? 'laser_horizontal' : 'laser_vertical';
    const sprite = scene.add.sprite(x, y, frame);
    AssetManager.playAnimation(sprite, anim);
    return sprite;
  }

  static spawnPillar(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const rand = Math.random();
    let key = 'pillar_idle_01';
    if (rand < 0.25) {
      key = 'pillar_intact_02';
    } else if (rand < 0.4) {
      key = 'pillar_intact_03';
    } else if (rand < 0.9) {
      const idx = String(Math.floor(Math.random() * 13) + 1).padStart(2, '0');
      key = `pillar_broken_${idx}`;
    }
    return scene.add.sprite(x, y, key);
  }

  static spawnProp(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const rand = Math.random();
    let key = 'props_idle_01';
    if (rand < 0.95) {
      const idx = String(Math.floor(Math.random() * 52) + 2).padStart(2, '0');
      key = `prop_decor_${idx}`;
    }
    return scene.add.sprite(x, y, key);
  }

  static spawnFloorTile(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const idx = String(Math.floor(Math.random() * 6) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `floor_tile_${idx}`);
  }

  static spawnWallTile(scene: Scene, x: number, y: number): GameObjects.Sprite {
    return scene.add.sprite(x, y, 'floor_tile_11');
  }

  static spawnWallDecoration(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const idx = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `wall_detail_${idx}`);
  }

  static spawnDungeonStructure(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const idx = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `dungeon_structure_${idx}`);
  }

  static spawnLava(scene: Scene, x: number, y: number, _type: 'a' | 'b' | 'fringe_a' | 'fringe_b' = 'a'): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'lava_flow_a_01');
    AssetManager.playAnimation(sprite, 'lava_flow_a');
    return sprite;
  }

  static spawnParticle(scene: Scene, x: number, y: number, type: 'ember' | 'spark' | 'dust' | 'smoke' | 'sparkle'): GameObjects.Sprite {
    const frameMap = {
      ember: 'checkpoint_frame_07',
      spark: 'checkpoint_frame_13',
      dust: 'checkpoint_frame_19',
      smoke: 'checkpoint_frame_25',
      sparkle: 'checkpoint_frame_32',
    };
    const sprite = scene.add.sprite(x, y, frameMap[type]);
    AssetManager.playAnimation(sprite, `particle_${type}`);
    return sprite;
  }

  static spawnBackground(scene: Scene, x: number, y: number): GameObjects.Sprite {
    return scene.add.sprite(x, y, 'bg_main');
  }

  static spawnDecoration(scene: Scene, x: number, y: number): GameObjects.Sprite {
    return AssetManager.spawnProp(scene, x, y);
  }

  static isReady(): boolean {
    return AssetManager.animationsReady;
  }

  private static requireScene(): Scene {
    if (!AssetManager.scene) {
      throw new Error('AssetManager: scene context missing.');
    }
    return AssetManager.scene;
  }
}
