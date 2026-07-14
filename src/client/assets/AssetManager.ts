import type { Scene, GameObjects } from 'phaser';
import type { AssetCategoryId } from './AssetCategory';
import type {
  AnimationDef,
  AssetSheetDef,
  AssetsManifest,
  DetectionReport,
} from './types';
import { LAYOUT_OVERRIDES } from './layoutOverrides';

const ASSET_BASE = 'assets';

/**
 * Central registry for all game textures, frames, and animations.
 * Scenes must never load sprite sheets directly — use this API.
 */
export class AssetManager {
  private static scene: Scene | undefined;
  private static sheetsByName = new Map<string, AssetSheetDef>();
  private static sheetsByCategory = new Map<AssetCategoryId, AssetSheetDef[]>();
  private static loadedTextureKeys = new Set<string>();
  private static animationsReady = false;
  private static detectionReports: DetectionReport[] = [];

  /** Absolute URL / relative path prefix for asset files. */
  static basePath = ASSET_BASE;

  static getSheets(): readonly AssetSheetDef[] {
    return [...AssetManager.sheetsByName.values()];
  }

  static getReport(): readonly DetectionReport[] {
    return AssetManager.detectionReports;
  }

  static getTexture(key: string): string {
    return key;
  }

  static getAnimation(key: string): string {
    return key;
  }

  static getSheet(name: string): AssetSheetDef | undefined {
    return AssetManager.sheetsByName.get(name);
  }

  static getSheetsByCategory(category: AssetCategoryId): readonly AssetSheetDef[] {
    return AssetManager.sheetsByCategory.get(category) ?? [];
  }

  /**
   * Registers catalog entries. Call once before loadAssets (or it auto-inits).
   */
  static initCatalog(sheets: readonly AssetSheetDef[] = LAYOUT_OVERRIDES): void {
    AssetManager.sheetsByName.clear();
    AssetManager.sheetsByCategory.clear();
    AssetManager.detectionReports = [];

    for (const sheet of sheets) {
      AssetManager.sheetsByName.set(sheet.name, sheet);

      const list = AssetManager.sheetsByCategory.get(sheet.category) ?? [];
      list.push(sheet);
      AssetManager.sheetsByCategory.set(sheet.category, list);

      if (sheet.detectionStatus === 'needs_confirmation') {
        AssetManager.pushNeedsConfirmation(sheet);
      }
    }

    AssetManager.printDetectionReport();
  }

  /**
   * Phaser Loader: queues every unique texture as an individual frame image. Safe to call from Preloader.preload().
   */
  static loadAssets(scene: Scene): void {
    if (AssetManager.sheetsByName.size === 0) {
      AssetManager.initCatalog();
    }

    AssetManager.scene = scene;
    const queued = new Set<string>();

    for (const sheet of AssetManager.sheetsByName.values()) {
      if (queued.has(sheet.textureKey)) {
        continue;
      }
      queued.add(sheet.textureKey);

      if (sheet.loadMode === 'image') {
        const url = `${AssetManager.basePath}/${sheet.path}`;
        scene.load.image(sheet.textureKey, url);
        AssetManager.loadedTextureKeys.add(sheet.textureKey);
      } else {
        // Load individual cropped frames
        const subDir = AssetManager.getSubdirForSheet(sheet.name);
        for (let i = 0; i < sheet.frames; i++) {
          if (sheet.emptyFrames.includes(i)) {
            continue;
          }
          const name = AssetManager.getDescriptiveName(sheet.name, i, sheet.animations);
          const url = `${AssetManager.basePath}/${subDir}/${name}.png`;
          scene.load.image(name, url);
          AssetManager.loadedTextureKeys.add(name);
        }
      }
    }
  }

  /**
   * After textures resolve: create all animations from individual frame images.
   * Call from Preloader.create() (or any scene create after load).
   */
  static createAnimations(scene: Scene): void {
    AssetManager.scene = scene;

    if (AssetManager.sheetsByName.size === 0) {
      AssetManager.initCatalog();
    }

    for (const sheet of AssetManager.sheetsByName.values()) {
      if (sheet.loadMode === 'image') {
        continue;
      }
      for (const anim of sheet.animations) {
        if (scene.anims.exists(anim.name)) {
          continue;
        }
        const frames: Array<{ key: string }> = [];
        for (let i = anim.start; i <= anim.end; i += 1) {
          if (sheet.emptyFrames.includes(i)) {
            continue;
          }
          const frameName = AssetManager.getDescriptiveName(sheet.name, i, sheet.animations);
          frames.push({ key: frameName });
        }
        if (frames.length > 0) {
          scene.anims.create({
            key: anim.name,
            frames: frames,
            frameRate: anim.fps,
            repeat: anim.repeat,
          });
        }
      }
    }

    AssetManager.animationsReady = true;
  }

  static playAnimation(sprite: GameObjects.Sprite, name: string): GameObjects.Sprite {
    if (sprite.anims) {
      sprite.anims.play(name, true);
    }
    return sprite;
  }

  // ---------------------------------------------------------------------------
  // Convenience play helpers
  // ---------------------------------------------------------------------------

  static playTorch(sprite: GameObjects.Sprite): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, 'torch_idle');
  }

  static playDoor(sprite: GameObjects.Sprite, state: 'closed' | 'opening' | 'open' = 'closed'): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `door_${state}`);
  }

  static playPortal(sprite: GameObjects.Sprite, state: 'idle' | 'activate' | 'loop' = 'idle'): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `portal_${state}`);
  }

  static playCube(
    sprite: GameObjects.Sprite,
    state: 'idle' | 'move' | 'jump' | 'charged' | 'damage' | 'destroy' = 'idle'
  ): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `cube_${state}`);
  }

  static playPressurePlate(
    sprite: GameObjects.Sprite,
    state: 'idle' | 'pressed' | 'activated' = 'idle'
  ): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, `plate_${state}`);
  }

  static playCrystal(sprite: GameObjects.Sprite, activated = false): GameObjects.Sprite {
    return AssetManager.playAnimation(sprite, activated ? 'crystal_activated' : 'crystal_idle');
  }

  static playCheckpoint(sprite: GameObjects.Sprite, activated = false): GameObjects.Sprite {
    return AssetManager.playAnimation(
      sprite,
      activated ? 'checkpoint_activated' : 'checkpoint_idle'
    );
  }

  // ---------------------------------------------------------------------------
  // Create / spawn helpers — return fully animated GameObjects
  // ---------------------------------------------------------------------------

  static createTorch(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'torch', 'torch_idle');
  }

  static createDoor(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'door', 'door_closed');
  }

  static createPortal(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'portal', 'portal_idle');
  }

  static createCheckpoint(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'checkpoint', 'checkpoint_idle');
  }

  static createPressurePlate(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'pressure_plate', 'plate_idle');
  }

  static createCrystal(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'crystal', 'crystal_idle');
  }

  static createCube(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'cube', 'cube_idle');
  }

  static createBridge(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'bridge', 'bridge_lowered');
  }

  static createLaserHorizontal(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'laser_horizontal', 'laser_h_idle');
  }

  static createLaserVertical(x: number, y: number, scene = AssetManager.requireScene()): GameObjects.Sprite {
    return AssetManager.spawnAnimated(scene, x, y, 'laser_vertical', 'laser_v_idle');
  }

  static createPillar(
    x: number,
    y: number,
    variant = 0,
    scene = AssetManager.requireScene()
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet('pillar');
    const frameIndex = Math.max(0, Math.min(variant, sheet.frames - 1));
    const frameName = AssetManager.getDescriptiveName(sheet.name, frameIndex, sheet.animations);
    return scene.add.sprite(x, y, frameName);
  }

  static createTile(
    x: number,
    y: number,
    frameIndex = 0,
    scene = AssetManager.requireScene()
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet('tiles');
    const frameName = AssetManager.getDescriptiveName(sheet.name, frameIndex, sheet.animations);
    return scene.add.sprite(x, y, frameName);
  }

  static createProp(
    x: number,
    y: number,
    frameIndex = 0,
    scene = AssetManager.requireScene()
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet('props');
    const frameName = AssetManager.getDescriptiveName(sheet.name, frameIndex, sheet.animations);
    return scene.add.sprite(x, y, frameName);
  }

  static spawnTorch(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createTorch(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnDoor(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createDoor(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnPortal(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createPortal(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnCube(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createCube(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnCheckpoint(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createCheckpoint(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnPressurePlate(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createPressurePlate(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnCrystal(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createCrystal(x, y, scene ?? AssetManager.requireScene());
  }

  static spawnBridge(x: number, y: number, scene?: Scene): GameObjects.Sprite {
    return AssetManager.createBridge(x, y, scene ?? AssetManager.requireScene());
  }

  /**
   * Builds the JSON-serializable catalog (for assets.json / tooling).
   */
  static toManifest(): AssetsManifest {
    if (AssetManager.sheetsByName.size === 0) {
      AssetManager.initCatalog();
    }

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      basePath: AssetManager.basePath,
      sheets: AssetManager.getSheets().map((sheet) => ({ ...sheet })),
      reports: [...AssetManager.detectionReports],
    };
  }

  /**
   * Generates the Phaser load snippets developers can paste / verify.
   */
  static generateLoadCode(): string {
    if (AssetManager.sheetsByName.size === 0) {
      AssetManager.initCatalog();
    }

    const lines: string[] = ['// Auto-generated by AssetManager — loaded as individual frame textures.'];

    for (const sheet of AssetManager.sheetsByName.values()) {
      if (sheet.loadMode === 'image') {
        const url = `${AssetManager.basePath}/${sheet.path}`;
        lines.push(`scene.load.image("${sheet.textureKey}", "${url}");`);
      } else {
        const subDir = AssetManager.getSubdirForSheet(sheet.name);
        for (let i = 0; i < sheet.frames; i++) {
          if (sheet.emptyFrames.includes(i)) continue;
          const name = AssetManager.getDescriptiveName(sheet.name, i, sheet.animations);
          const url = `${AssetManager.basePath}/${subDir}/${name}.png`;
          lines.push(`scene.load.image("${name}", "${url}");`);
        }
      }
    }

    return lines.join('\n');
  }

  static isReady(): boolean {
    return AssetManager.animationsReady;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private static requireScene(): Scene {
    if (!AssetManager.scene) {
      throw new Error('AssetManager: call loadAssets/createAnimations before spawning objects.');
    }
    return AssetManager.scene;
  }

  private static requireSheet(name: string): AssetSheetDef {
    const sheet = AssetManager.sheetsByName.get(name);
    if (!sheet) {
      throw new Error(`AssetManager: unknown asset "${name}".`);
    }
    return sheet;
  }

  private static spawnAnimated(
    scene: Scene,
    x: number,
    y: number,
    sheetName: string,
    animKey: string
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet(sheetName);
    const anim = sheet.animations.find((a) => a.name === animKey);
    const frameIndex = anim ? anim.start : 0;
    const frameName = AssetManager.getDescriptiveName(sheet.name, frameIndex, sheet.animations);
    const sprite = scene.add.sprite(x, y, frameName);
    AssetManager.playAnimation(sprite, animKey);
    return sprite;
  }

  private static getSubdirForSheet(sheetName: string): string {
    switch (sheetName) {
      case 'cube': return 'characters';
      case 'door': return 'doors';
      case 'portal': return 'portals';
      case 'props': return 'props';
      case 'tiles': return 'tiles';
      case 'ui_buttons':
      case 'ui_icons':
        return 'ui';
      case 'checkpoint': return 'interactive/Check Point';
      case 'bridge':
      case 'laser_horizontal':
      case 'laser_vertical':
        return 'interactive/Energy Beam';
      case 'pillar':
      case 'torch':
        return 'interactive/Pillar';
      case 'pressure_plate':
      case 'crystal':
        return 'interactive/Pressure Plate';
      default:
        return sheetName;
    }
  }

  public static getDescriptiveName(sheetName: string, frameIndex: number, anims: AnimationDef[]): string {
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
  }

  private static pushNeedsConfirmation(sheet: AssetSheetDef): void {
    const possible =
      sheet.possibleSizes ??
      ([
        { frameWidth: 64, frameHeight: 64 },
        { frameWidth: 128, frameHeight: 128 },
        { frameWidth: 256, frameHeight: 256 },
      ] as const);

    const report: DetectionReport = {
      path: sheet.path,
      name: sheet.name,
      width: sheet.columns * sheet.frameWidth,
      height: sheet.rows * sheet.frameHeight,
      status: 'needs_confirmation',
      message: [
        `${sheet.path}`,
        'Unable to determine frame size.',
        'Possible:',
        ...possible.map((s) => `${s.frameWidth}x${s.frameHeight}`),
        'Needs confirmation.',
      ].join('\n'),
      possibleSizes: possible,
    };
    AssetManager.detectionReports.push(report);
  }

  private static printDetectionReport(): void {
    const uncertain = [...AssetManager.sheetsByName.values()].filter(
      (s) => s.detectionStatus === 'needs_confirmation'
    );
    const overrides = [...AssetManager.sheetsByName.values()].filter(
      (s) => s.detectionStatus === 'override'
    );

    if (uncertain.length === 0 && overrides.length === 0) {
      return;
    }

    console.group('[AssetManager] Sprite sheet detection report');
    for (const sheet of overrides) {
      console.info(
        `${sheet.path} → "${sheet.name}" using curated override (${sheet.columns}x${sheet.rows} @ ${sheet.frameWidth}x${sheet.frameHeight}). ${sheet.notes ?? ''}`
      );
    }
    for (const sheet of uncertain) {
      console.warn(
        [
          sheet.path,
          'Unable to determine frame size.',
          'Possible:',
          ...(sheet.possibleSizes ?? []).map((s) => `${s.frameWidth}x${s.frameHeight}`),
          'Needs confirmation.',
        ].join('\n')
      );
    }
    console.groupEnd();
  }
}
