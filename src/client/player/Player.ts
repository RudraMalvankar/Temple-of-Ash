import * as Phaser from 'phaser';
import type { Scene } from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { DEFAULT_PLAYER_CONFIG, type PlayerConfig } from './PlayerConfig';
import { PlayerInput } from './PlayerInput';
import { PlayerAnimator } from './PlayerAnimator';
import { PlayerController } from './PlayerController';
import type { PlayerRuntimeState } from './PlayerState';

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export type PlayerCreateOptions = {
  x: number;
  y: number;
  config?: Partial<PlayerConfig>;
  blockedCells?: Set<string>;
};

/**
 * Playable magical cube. Scenes only construct + update this facade —
 * movement, input, and presentation live in dedicated collaborators.
 */
export class Player {
  readonly sprite: ArcadeSprite;
  readonly config: PlayerConfig;

  private readonly input: PlayerInput;
  private readonly controller: PlayerController;
  private readonly animator: PlayerAnimator;
  private destroyed = false;

  private constructor(scene: Scene, sprite: ArcadeSprite, config: PlayerConfig, blockedCells?: Set<string>) {
    this.sprite = sprite;
    this.config = config;
    this.input = new PlayerInput(scene, config.joystick);
    this.controller = new PlayerController(scene, sprite, config, blockedCells);
    this.animator = new PlayerAnimator(scene, sprite, config);
  }

  static create(scene: Scene, options: PlayerCreateOptions): Player {
    const overrides = options.config;
    const config: PlayerConfig = {
      ...DEFAULT_PLAYER_CONFIG,
      ...overrides,
      cameraDeadzone: {
        ...DEFAULT_PLAYER_CONFIG.cameraDeadzone,
        ...(overrides?.cameraDeadzone ?? {}),
      },
      impactShake: {
        ...DEFAULT_PLAYER_CONFIG.impactShake,
        ...(overrides?.impactShake ?? {}),
      },
      stopSquash: {
        ...DEFAULT_PLAYER_CONFIG.stopSquash,
        ...(overrides?.stopSquash ?? {}),
      },
      glow: { ...DEFAULT_PLAYER_CONFIG.glow, ...(overrides?.glow ?? {}) },
      shadow: { ...DEFAULT_PLAYER_CONFIG.shadow, ...(overrides?.shadow ?? {}) },
      dust: { ...DEFAULT_PLAYER_CONFIG.dust, ...(overrides?.dust ?? {}) },
      ember: { ...DEFAULT_PLAYER_CONFIG.ember, ...(overrides?.ember ?? {}) },
      joystick: { ...DEFAULT_PLAYER_CONFIG.joystick, ...(overrides?.joystick ?? {}) },
    };

    const sheet = AssetManager.getSheet('cube');
    if (!sheet) {
      throw new Error('Player: cube sheet is not registered in AssetManager');
    }

    const hasFrame = scene.textures.get(sheet.textureKey).has('cube_0');
    const sprite = hasFrame
      ? scene.physics.add.sprite(options.x, options.y, sheet.textureKey, 'cube_0')
      : scene.physics.add.sprite(options.x, options.y, sheet.textureKey);

    sprite.setScale(config.displayScale);
    sprite.setOrigin(0.5, 0.72);
    AssetManager.playCube(sprite, 'idle');

    return new Player(scene, sprite, config, options.blockedCells);
  }

  update(deltaMs: number): void {
    if (this.destroyed) {
      return;
    }

    const vector = this.input.getVector();
    const { shouldSquash } = this.controller.update(deltaMs, vector);

    if (shouldSquash && !this.controller.state.isSquashing) {
      this.controller.state.isSquashing = true;
      this.animator.playStopSquash(() => {
        this.controller.state.isSquashing = false;
      });
    }

    this.animator.update(this.controller.state);
  }

  getState(): PlayerRuntimeState {
    return this.controller.state;
  }

  getGridPosition(): { col: number; row: number; worldX: number; worldY: number } {
    return this.controller.getGridPosition();
  }

  snapToGrid(): void {
    this.controller.snapToGrid();
  }

  /** Attach a smoothed follow camera. */
  bindCamera(camera: Phaser.Cameras.Scene2D.Camera): void {
    camera.startFollow(this.sprite, true, this.config.cameraLerp, this.config.cameraLerp);
    camera.setDeadzone(this.config.cameraDeadzone.width, this.config.cameraDeadzone.height);
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.input.destroy();
    this.controller.destroy();
    this.animator.destroy();
    this.sprite.destroy();
  }
}
