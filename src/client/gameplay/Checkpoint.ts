import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';

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
    this.sprite.setDisplaySize(gridSize, gridSize * 1.5);
    this.sprite.setOrigin(0.5, 1.0); // bottom anchor
    this.sprite.setDepth(3);

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
