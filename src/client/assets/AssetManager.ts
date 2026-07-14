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
  key: string; // Animation key
  category: AssetCategory;
  prefix: string; // Prefix of file names
  subDir: string;
  frames: number;
  fps: number;
  repeat: number;
};

// ---------------------------------------------------------
// Static Assets Manifest (audited files)
// ---------------------------------------------------------
const STATIC_ASSETS: StaticAssetDef[] = [
  // Backgrounds
  { key: 'bg_main', path: 'backgrounds/bg.png', category: 'BACKGROUND' },
  { key: 'parallax_bg_foreground', path: 'backgrounds/parallax_bg_foreground.png', category: 'BACKGROUND' },
  { key: 'parallax_bg_mountains', path: 'backgrounds/parallax_bg_mountains.png', category: 'BACKGROUND' },
  { key: 'parallax_bg_sky', path: 'backgrounds/parallax_bg_sky.png', category: 'BACKGROUND' },

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
  ...['blue', 'yellow', 'red', 'green'].flatMap((color) =>
    ['idle', 'hover', 'pressed', 'disabled', 'state'].map((state) => ({
      key: `button_rectangular_${color}_${state}`,
      path: `ui/button_rectangular_${color}_${state}.png`,
      category: 'UI' as AssetCategory,
    }))
  ),

  // UI Icon elements
  ...[
    'play', 'pause', 'restart', 'close', 'check', 'arrow_left', 'arrow_right',
    'sound_on', 'sound_off', 'music_on', 'music_off', 'star', 'lock', 'unlock',
    'home', 'menu', 'settings', 'info', 'help', 'trophy', 'leaderboard'
  ].map((name) => ({
    key: `icon_${name}`,
    path: `ui/icon_${name}.png`,
    category: 'UI' as AssetCategory,
  })),

  // UI Logo
  { key: 'logo_title', path: 'ui/logo_title.png', category: 'UI' },

  // Effects static overlays
  { key: 'effect_ambient_glow', path: 'effects/effect_ambient_glow.png', category: 'UI' },
  { key: 'effect_vignette', path: 'effects/effect_vignette.png', category: 'UI' },
  { key: 'effect_lens_flare', path: 'effects/effect_lens_flare.png', category: 'UI' },
  { key: 'effect_particles_dust', path: 'effects/effect_particles_dust.png', category: 'UI' },
];

// ---------------------------------------------------------
// Animation Sequence Assets Manifest
// ---------------------------------------------------------
const ANIM_ASSETS: AnimAssetDef[] = [
  // Player Animations
  { key: 'cube_idle', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, fps: 6, repeat: -1 },
  { key: 'cube_move', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, fps: 10, repeat: -1 },
  { key: 'cube_jump', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, fps: 10, repeat: 0 },
  { key: 'cube_charged', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, fps: 8, repeat: -1 },
  { key: 'cube_damage', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 5, fps: 8, repeat: 0 },
  { key: 'cube_destroy', category: 'CHARACTERS', prefix: 'cube_frame_', subDir: 'characters', frames: 4, fps: 8, repeat: 0 },

  // Doors
  { key: 'door_closed', category: 'DOORS', prefix: 'door_closed_', subDir: 'doors', frames: 5, fps: 6, repeat: -1 },
  { key: 'door_opening', category: 'DOORS', prefix: 'door_opening_', subDir: 'doors', frames: 5, fps: 10, repeat: 0 },
  { key: 'door_open', category: 'DOORS', prefix: 'door_open_', subDir: 'doors', frames: 5, fps: 6, repeat: -1 },

  // Portals
  { key: 'portal_idle', category: 'PORTALS', prefix: 'portal_idle_', subDir: 'portals', frames: 2, fps: 4, repeat: -1 },
  { key: 'portal_activate', category: 'PORTALS', prefix: 'portal_activate_', subDir: 'portals', frames: 2, fps: 8, repeat: 0 },

  // Checkpoints
  { key: 'checkpoint_inactive', category: 'CHECKPOINTS', prefix: 'checkpoint_inactive_', subDir: 'interactive/Check Point', frames: 3, fps: 6, repeat: -1 },
  { key: 'checkpoint_active', category: 'CHECKPOINTS', prefix: 'checkpoint_active_', subDir: 'interactive/Check Point', frames: 3, fps: 8, repeat: -1 },

  // Particles
  { key: 'particle_ember', category: 'PARTICLES', prefix: 'ember_', subDir: 'interactive/Check Point', frames: 6, fps: 10, repeat: -1 },
  { key: 'particle_spark', category: 'PARTICLES', prefix: 'spark_', subDir: 'interactive/Check Point', frames: 6, fps: 12, repeat: -1 },
  { key: 'particle_dust', category: 'PARTICLES', prefix: 'dust_', subDir: 'interactive/Check Point', frames: 6, fps: 8, repeat: -1 },
  { key: 'particle_smoke', category: 'PARTICLES', prefix: 'smoke_', subDir: 'interactive/Check Point', frames: 6, fps: 8, repeat: -1 },
  { key: 'particle_sparkle', category: 'PARTICLES', prefix: 'sparkle_', subDir: 'interactive/Check Point', frames: 6, fps: 12, repeat: -1 },

  // Bridges
  { key: 'bridge_lowered', category: 'BRIDGES', prefix: 'bridge_lowered_', subDir: 'interactive/Energy Beam', frames: 3, fps: 6, repeat: -1 },
  { key: 'bridge_raising', category: 'BRIDGES', prefix: 'bridge_raising_', subDir: 'interactive/Energy Beam', frames: 3, fps: 10, repeat: 0 },
  { key: 'bridge_raised', category: 'BRIDGES', prefix: 'bridge_raised_', subDir: 'interactive/Energy Beam', frames: 3, fps: 6, repeat: -1 },

  // Lasers
  { key: 'laser_horizontal', category: 'LASERS', prefix: 'laser_h_', subDir: 'interactive/Energy Beam', frames: 4, fps: 8, repeat: -1 },
  { key: 'laser_vertical', category: 'LASERS', prefix: 'laser_v_', subDir: 'interactive/Energy Beam', frames: 5, fps: 8, repeat: -1 },

  // Torches
  { key: 'torch_idle', category: 'TORCHES', prefix: 'torch_idle_', subDir: 'interactive/Pillar', frames: 5, fps: 8, repeat: -1 },
  { key: 'torch_extinguish', category: 'TORCHES', prefix: 'torch_extinguish_', subDir: 'interactive/Pillar', frames: 5, fps: 8, repeat: 0 },

  // Pressure Plates
  { key: 'pressure_plate_idle', category: 'PRESSURE_PLATES', prefix: 'pressure_plate_idle_', subDir: 'interactive/Pressure Plate', frames: 4, fps: 6, repeat: -1 },
  { key: 'pressure_plate_pressed', category: 'PRESSURE_PLATES', prefix: 'pressure_plate_pressed_', subDir: 'interactive/Pressure Plate', frames: 3, fps: 10, repeat: 0 },
  { key: 'pressure_plate_activated', category: 'PRESSURE_PLATES', prefix: 'pressure_plate_activated_', subDir: 'interactive/Pressure Plate', frames: 3, fps: 8, repeat: -1 },

  // Crystals
  { key: 'crystal_idle', category: 'CRYSTALS', prefix: 'crystal_idle_', subDir: 'interactive/Pressure Plate', frames: 5, fps: 6, repeat: -1 },
  { key: 'crystal_active', category: 'CRYSTALS', prefix: 'crystal_active_', subDir: 'interactive/Pressure Plate', frames: 5, fps: 8, repeat: -1 },

  // Lava
  { key: 'lava_flow_a', category: 'LAVA', prefix: 'lava_flow_a_', subDir: 'tiles', frames: 6, fps: 6, repeat: -1 },
  { key: 'lava_flow_b', category: 'LAVA', prefix: 'lava_flow_b_', subDir: 'tiles', frames: 6, fps: 6, repeat: -1 },
  { key: 'lava_fringe_a', category: 'LAVA', prefix: 'lava_fringe_a_', subDir: 'tiles', frames: 6, fps: 6, repeat: -1 },
  { key: 'lava_fringe_b', category: 'LAVA', prefix: 'lava_fringe_b_', subDir: 'tiles', frames: 6, fps: 6, repeat: -1 },
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
      let startIndex = 1;
      if (anim.key === 'cube_move') startIndex = 6;
      else if (anim.key === 'cube_jump') startIndex = 11;
      else if (anim.key === 'cube_charged') startIndex = 16;
      else if (anim.key === 'cube_damage') startIndex = 21;
      else if (anim.key === 'cube_destroy') startIndex = 26;

      for (let i = 0; i < anim.frames; i++) {
        const frameIndex = startIndex + i;
        const frameName = `${anim.prefix}${String(frameIndex).padStart(2, '0')}`;
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

      let startIndex = 1;
      if (anim.key === 'cube_move') startIndex = 6;
      else if (anim.key === 'cube_jump') startIndex = 11;
      else if (anim.key === 'cube_charged') startIndex = 16;
      else if (anim.key === 'cube_damage') startIndex = 21;
      else if (anim.key === 'cube_destroy') startIndex = 26;

      const frames: Array<{ key: string }> = [];
      for (let i = 0; i < anim.frames; i++) {
        const frameIndex = startIndex + i;
        const frameName = `${anim.prefix}${String(frameIndex).padStart(2, '0')}`;
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

  static getSheet(name: string) {
    if (name === 'cube') {
      return { textureKey: 'cube_frame_01' };
    }
    const s = STATIC_ASSETS.find(a => a.key === name);
    if (s) return { textureKey: s.key };
    const a = ANIM_ASSETS.find(am => am.key === name);
    if (a) return { textureKey: a.prefix + '01' };
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

  static playPressurePlate(sprite: GameObjects.Sprite, state: string): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `pressure_plate_${state}`);
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
    const sprite = scene.add.sprite(x, y, 'player_cube');
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
    const sprite = scene.add.sprite(x, y, 'checkpoint_inactive_01');
    AssetManager.playAnimation(sprite, 'checkpoint_inactive');
    return sprite;
  }

  static spawnPressurePlate(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'pressure_plate_idle_01');
    AssetManager.playAnimation(sprite, 'pressure_plate_idle');
    return sprite;
  }

  static spawnCrystal(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'crystal_idle_01');
    AssetManager.playAnimation(sprite, 'crystal_idle');
    return sprite;
  }

  static spawnTorch(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'torch_idle_01');
    AssetManager.playAnimation(sprite, 'torch_idle');
    return sprite;
  }

  static spawnBridge(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const sprite = scene.add.sprite(x, y, 'bridge_lowered_01');
    AssetManager.playAnimation(sprite, 'bridge_lowered');
    return sprite;
  }

  static spawnLaser(scene: Scene, x: number, y: number, orientation: 'horizontal' | 'vertical'): GameObjects.Sprite {
    const frame = orientation === 'horizontal' ? 'laser_h_01' : 'laser_v_01';
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
    const idx = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `floor_tile_${idx}`);
  }

  static spawnWallTile(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const idx = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `wall_tile_${idx}`);
  }

  static spawnWallDecoration(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const idx = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `wall_detail_${idx}`);
  }

  static spawnDungeonStructure(scene: Scene, x: number, y: number): GameObjects.Sprite {
    const idx = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    return scene.add.sprite(x, y, `dungeon_structure_${idx}`);
  }

  static spawnLava(scene: Scene, x: number, y: number, type: 'a' | 'b' | 'fringe_a' | 'fringe_b' = 'a'): GameObjects.Sprite {
    const frame = type === 'a'
      ? 'lava_flow_a_01'
      : type === 'b'
      ? 'lava_flow_b_01'
      : type === 'fringe_a'
      ? 'lava_fringe_a_01'
      : 'lava_fringe_b_01';

    const sprite = scene.add.sprite(x, y, frame);
    AssetManager.playAnimation(sprite, type === 'a' ? 'lava_flow_a' : type === 'b' ? 'lava_flow_b' : type === 'fringe_a' ? 'lava_fringe_a' : 'lava_fringe_b');
    return sprite;
  }

  static spawnParticle(scene: Scene, x: number, y: number, type: 'ember' | 'spark' | 'dust' | 'smoke' | 'sparkle'): GameObjects.Sprite {
    const frameMap = {
      ember: 'ember_01',
      spark: 'spark_01',
      dust: 'dust_01',
      smoke: 'smoke_01',
      sparkle: 'sparkle_01',
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
