import * as Phaser from 'phaser';
import type { Scene, GameObjects } from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import type { PlayerConfig } from './PlayerConfig';
import { PlayerStateId, type PlayerRuntimeState } from './PlayerState';

type ParticleEmitterLike = GameObjects.Particles.ParticleEmitter;

/**
 * Owns presentation: animations, VFX, squash/stretch, glow, shadow.
 * Never sets velocity — Controller does that.
 */
export class PlayerAnimator {
  private readonly glow: GameObjects.Arc;
  private readonly shadow: GameObjects.Ellipse;
  private dust: ParticleEmitterLike | undefined;
  private ember: ParticleEmitterLike | undefined;
  private squashTween: Phaser.Tweens.Tween | undefined;
  private readonly baseScale: number;

  constructor(
    private readonly scene: Scene,
    private readonly sprite: GameObjects.Sprite,
    private readonly config: PlayerConfig
  ) {
    this.baseScale = config.displayScale;

    this.shadow = scene.add
      .ellipse(
        sprite.x,
        sprite.y + config.shadow.offsetY,
        config.shadow.width,
        config.shadow.height,
        0x000000,
        config.shadow.alpha
      )
      .setDepth(sprite.depth - 2);

    this.glow = scene.add
      .circle(sprite.x, sprite.y, config.glow.radius, config.glow.color, config.glow.alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(sprite.depth - 1);

    this.createParticles();
  }

  update(state: PlayerRuntimeState): void {
    this.shadow.setPosition(this.sprite.x, this.sprite.y + this.config.shadow.offsetY);
    this.glow.setPosition(this.sprite.x, this.sprite.y);

    const pulse = 0.85 + Math.min(state.speed / this.config.moveSpeed, 1) * 0.35;
    this.glow.setScale(pulse);
    this.glow.setAlpha(this.config.glow.alpha * (0.7 + pulse * 0.3));

    const shadowStretch = state.id === PlayerStateId.Rolling ? 1.15 : 1;
    this.shadow.setScale(shadowStretch, 1);

    this.syncParticles(state);
  }

  playStopSquash(onComplete?: () => void): void {
    if (this.squashTween) {
      this.squashTween.stop();
    }

    const { scaleX, scaleY, durationMs } = this.config.stopSquash;
    this.sprite.setScale(this.baseScale * scaleX, this.baseScale * scaleY);

    this.squashTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale,
      scaleY: this.baseScale,
      duration: durationMs,
      ease: 'Back.Out',
      onComplete: () => {
        this.squashTween = undefined;
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  destroy(): void {
    this.squashTween?.stop();
    this.dust?.stop();
    this.ember?.stop();
    this.dust?.destroy();
    this.ember?.destroy();
    this.glow.destroy();
    this.shadow.destroy();
  }

  private syncParticles(state: PlayerRuntimeState): void {
    const moving = state.speed > 20;
    if (this.dust) {
      this.dust.setPosition(this.sprite.x, this.sprite.y + 16);
      if (moving) {
        this.dust.start();
        this.dust.quantity = this.config.dust.quantity;
      } else {
        this.dust.stop();
      }
    }
    if (this.ember) {
      this.ember.setPosition(this.sprite.x, this.sprite.y);
      if (moving) {
        this.ember.start();
        this.ember.quantity = this.config.ember.quantity;
      } else {
        this.ember.stop();
      }
    }
  }

  private createParticles(): void {
    const sheet = AssetManager.getSheet('particles');
    if (!sheet || !this.scene.textures.exists(sheet.textureKey)) {
      return;
    }

    const texture = this.scene.textures.get(sheet.textureKey);
    const dustFrame = texture.has('particles_12') ? 'particles_12' : undefined;
    const emberFrame = texture.has('particles_0') ? 'particles_0' : undefined;

    const dustConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      lifespan: 420,
      speed: { min: this.config.dust.speedMin, max: this.config.dust.speedMax },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.55, end: 0 },
      frequency: 55,
      quantity: 0,
      blendMode: 'NORMAL',
      emitting: false,
    };
    if (dustFrame) {
      dustConfig.frame = dustFrame;
    }

    this.dust = this.scene.add.particles(0, 0, sheet.textureKey, dustConfig);
    this.dust.setDepth(this.sprite.depth - 1);

    const emberConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      lifespan: 500,
      speed: { min: this.config.ember.speedMin, max: this.config.ember.speedMax },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 70,
      quantity: 0,
      tint: 0xff7a20,
      blendMode: 'ADD',
      emitting: false,
      gravityY: -20,
    };
    if (emberFrame) {
      emberConfig.frame = emberFrame;
    }

    this.ember = this.scene.add.particles(0, 0, sheet.textureKey, emberConfig);
    this.ember.setDepth(this.sprite.depth + 1);
  }
}
