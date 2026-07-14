import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';

export class Portal {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private active = false;
  private onPlayerEnter: () => void;

  constructor(scene: Scene, col: number, row: number, gridSize: number, onPlayerEnter: () => void) {
    this.col = col;
    this.row = row;
    this.onPlayerEnter = onPlayerEnter;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.sprite = AssetManager.spawnPortal(scene, x, y);
    this.sprite.setDepth(6);
    this.sprite.setAlpha(0.5); // Semi-transparent when inactive
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;

    if (this.active) {
      this.sprite.setAlpha(1.0);
      AssetManager.playPortal(this.sprite, 'activate');
    } else {
      this.sprite.setAlpha(0.5);
      AssetManager.playPortal(this.sprite, 'idle');
    }
  }

  update(playerCol: number, playerRow: number): void {
    if (this.active && playerCol === this.col && playerRow === this.row) {
      this.onPlayerEnter();
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
