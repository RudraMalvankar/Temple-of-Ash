import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { SoundEffects } from '../core/SoundEffects';

export class Portal {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private active = false;
  private onPlayerEnter: () => void;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private gridSize: number;

  constructor(scene: Scene, col: number, row: number, gridSize: number, onPlayerEnter: () => void) {
    this.col = col;
    this.row = row;
    this.onPlayerEnter = onPlayerEnter;
    this.gridSize = gridSize;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.sprite = AssetManager.spawnPortal(scene, x, y);
    this.sprite.setDisplaySize(gridSize, gridSize); // exactly one tile
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(6); // rendering depth 6
    
    // Portal starts completely invisible
    this.sprite.setVisible(false);
    this.sprite.setAlpha(0);
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;

    const scene = this.sprite.scene;
    if (this.active) {
      this.sprite.setVisible(true);
      
      // Play win/activation tune
      SoundEffects.playWin(scene);

      // Fade in portal
      scene.tweens.add({
        targets: this.sprite,
        alpha: 1.0,
        duration: 800,
        ease: 'Cubic.Out'
      });

      // Pulse scaling animation relative to its current scale
      this.sprite.setDisplaySize(this.gridSize, this.gridSize);
      const initScaleX = this.sprite.scaleX;
      const initScaleY = this.sprite.scaleY;

      this.pulseTween = scene.tweens.add({
        targets: this.sprite,
        scaleX: initScaleX * 1.1,
        scaleY: initScaleY * 1.1,
        yoyo: true,
        repeat: -1,
        duration: 1200,
        ease: 'Sine.InOut'
      });

      AssetManager.playPortal(this.sprite, 'activate');
    } else {
      if (this.pulseTween) {
        this.pulseTween.stop();
        this.pulseTween = null;
      }
      
      scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.sprite.setVisible(false);
        }
      });
      AssetManager.playPortal(this.sprite, 'idle');
    }
  }

  update(playerCol: number, playerRow: number): void {
    // Slow rotation
    if (this.active) {
      this.sprite.angle += 0.5;
    }

    if (this.active && playerCol === this.col && playerRow === this.row) {
      this.onPlayerEnter();
    }
  }

  destroy(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
    }
    this.sprite.destroy();
  }
}
