import type { Scene, GameObjects } from 'phaser';
import type { AssetCategoryId } from './AssetCategory';
import type {
  AnimationDef,
  AssetSheetDef,
  AssetsManifest,
  DetectionReport,
  FrameRect,
} from './types';
import { buildFrameRects } from './SpriteSheetAnalyzer';
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
  private static framesRegistered = new Set<string>();
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
   * Phaser Loader: queues every unique texture. Safe to call from Preloader.preload().
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
      if (scene.textures.exists(sheet.textureKey)) {
        AssetManager.loadedTextureKeys.add(sheet.textureKey);
        queued.add(sheet.textureKey);
        continue;
      }
      queued.add(sheet.textureKey);

      const url = `${AssetManager.basePath}/${sheet.path}`;

      if (sheet.loadMode === 'spritesheet') {
        scene.load.spritesheet(sheet.textureKey, url, {
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        });
      } else {
        scene.load.image(sheet.textureKey, url);
      }

      AssetManager.loadedTextureKeys.add(sheet.textureKey);
    }
  }

  /**
   * After textures resolve: register grid frames + create all animations.
   * Call from Preloader.create() (or any scene create after load).
   */
  static createAnimations(scene: Scene): void {
    AssetManager.scene = scene;

    if (AssetManager.sheetsByName.size === 0) {
      AssetManager.initCatalog();
    }

    for (const sheet of AssetManager.sheetsByName.values()) {
      if (sheet.loadMode === 'grid') {
        AssetManager.registerGridFrames(scene, sheet);
      }
    }

    for (const sheet of AssetManager.sheetsByName.values()) {
      for (const anim of sheet.animations) {
        AssetManager.createOneAnimation(scene, sheet, anim);
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
    const sprite = scene.add.sprite(x, y, sheet.textureKey, AssetManager.frameName(sheet, frameIndex));
    return sprite;
  }

  static createTile(
    x: number,
    y: number,
    frameIndex = 0,
    scene = AssetManager.requireScene()
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet('tiles');
    return scene.add.sprite(x, y, sheet.textureKey, frameIndex);
  }

  static createProp(
    x: number,
    y: number,
    frameIndex = 0,
    scene = AssetManager.requireScene()
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet('props');
    return scene.add.sprite(x, y, sheet.textureKey, frameIndex);
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

    const lines: string[] = ['// Auto-generated by AssetManager — do not load these in scenes directly.'];
    const seen = new Set<string>();

    for (const sheet of AssetManager.sheetsByName.values()) {
      if (seen.has(sheet.textureKey)) {
        continue;
      }
      seen.add(sheet.textureKey);
      const url = `${AssetManager.basePath}/${sheet.path}`;

      if (sheet.loadMode === 'spritesheet') {
        lines.push(
          `scene.load.spritesheet("${sheet.textureKey}", "${url}", { frameWidth: ${sheet.frameWidth}, frameHeight: ${sheet.frameHeight} });`
        );
      } else {
        lines.push(`scene.load.image("${sheet.textureKey}", "${url}");`);
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

  private static frameName(sheet: AssetSheetDef, index: number): string {
    return `${sheet.name}_${index}`;
  }

  private static spawnAnimated(
    scene: Scene,
    x: number,
    y: number,
    sheetName: string,
    animKey: string
  ): GameObjects.Sprite {
    const sheet = AssetManager.requireSheet(sheetName);
    const initialFrame =
      sheet.loadMode === 'spritesheet' ? 0 : AssetManager.frameName(sheet, 0);
    const sprite = scene.add.sprite(x, y, sheet.textureKey, initialFrame);
    AssetManager.playAnimation(sprite, animKey);
    return sprite;
  }

  private static registerGridFrames(scene: Scene, sheet: AssetSheetDef): void {
    const registryKey = `${sheet.textureKey}::${sheet.name}`;
    if (AssetManager.framesRegistered.has(registryKey)) {
      return;
    }

    if (!scene.textures.exists(sheet.textureKey)) {
      console.warn(`[AssetManager] Texture missing for grid asset "${sheet.name}" (${sheet.textureKey})`);
      return;
    }

    const texture = scene.textures.get(sheet.textureKey);
    const margin = sheet.margin ?? { left: 0, top: 0, right: 0, bottom: 0 };
    const spacing = sheet.spacing ?? { x: 0, y: 0 };

    const rects: FrameRect[] = buildFrameRects({
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
      if (texture.has(rect.name)) {
        continue;
      }
      texture.add(rect.name, 0, rect.x, rect.y, rect.width, rect.height);
    }

    AssetManager.framesRegistered.add(registryKey);
  }

  private static createOneAnimation(scene: Scene, sheet: AssetSheetDef, anim: AnimationDef): void {
    if (scene.anims.exists(anim.name)) {
      return;
    }

    if (sheet.loadMode === 'spritesheet' || sheet.loadMode === 'image') {
      scene.anims.create({
        key: anim.name,
        frames: scene.anims.generateFrameNumbers(sheet.textureKey, {
          start: anim.start,
          end: anim.end,
        }),
        frameRate: anim.fps,
        repeat: anim.repeat,
      });
      return;
    }

    // Grid mode — named frames (asset_0, asset_1, ...)
    const frames: Array<{ key: string; frame: string }> = [];
    for (let i = anim.start; i <= anim.end; i += 1) {
      if (sheet.emptyFrames.includes(i)) {
        continue;
      }
      frames.push({ key: sheet.textureKey, frame: AssetManager.frameName(sheet, i) });
    }

    if (frames.length === 0) {
      console.warn(`[AssetManager] Animation "${anim.name}" has no frames.`);
      return;
    }

    scene.anims.create({
      key: anim.name,
      frames,
      frameRate: anim.fps,
      repeat: anim.repeat,
    });
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
