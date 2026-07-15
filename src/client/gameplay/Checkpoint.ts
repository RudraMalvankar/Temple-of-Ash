import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { SoundEffects } from '../core/SoundEffects';

export class Checkpoint {
  static instances: Checkpoint[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private active = false;
  private onActivate: (col: number, row: number) => void;

  constructor(scene: Scene, col: number, row: number, gridSize: number, onActivate: (col: number, row: number) => void) {
    this.col = col;
    this.row = row;
    this.onActivate = onActivate;

    const x = col * gridSize + gridSize / 2;
    const y = (row + 1) * gridSize; // bottom of the grid cell

    this.sprite = AssetManager.spawnCheckpoint(scene, x, y);
    this.sprite.setDisplaySize(gridSize, gridSize);
    this.sprite.setOrigin(0.5, 1.0); // bottom anchor
    this.sprite.setDepth(3);

    // Soft glow pulsating animation
    scene.tweens.add({
      targets: this.sprite,
      alpha: { start: 0.65, end: 1.0 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.InOut'
    });

    Checkpoint.instances.push(this);
  }

  static clearRegistry(): void {
    Checkpoint.instances = [];
  }

  isActive(): boolean {
    return this.active;
  }

  update(playerCol: number, playerRow: number): void {
    if (!this.active && playerCol === this.col && playerRow === this.row) {
      // Deactivate all other checkpoints
      for (const cp of Checkpoint.instances) {
        if (cp !== this) {
          cp.deactivate();
        }
      }

      this.active = true;
      AssetManager.playCheckpoint(this.sprite, true);
      SoundEffects.playCheckpoint(this.sprite.scene);
      this.onActivate(this.col, this.row);
    }
  }

  deactivate(): void {
    if (this.active) {
      this.active = false;
      AssetManager.playCheckpoint(this.sprite, false);
    }
  }

  destroy(): void {
    this.sprite.destroy();
    const idx = Checkpoint.instances.indexOf(this);
    if (idx >= 0) {
      Checkpoint.instances.splice(idx, 1);
    }
  }
}
