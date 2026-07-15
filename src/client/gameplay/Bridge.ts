import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { SoundEffects } from '../core/SoundEffects';

export class Bridge {
  static instances: Bridge[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private active = false;
  private blockedCells: Set<string>;

  constructor(scene: Scene, col: number, row: number, gridSize: number, blockedCells: Set<string>) {
    this.col = col;
    this.row = row;
    this.blockedCells = blockedCells;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.sprite = AssetManager.spawnBridge(scene, x, y);
    this.sprite.setDisplaySize(gridSize, gridSize);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(4);

    // Starts lowered (blocked)
    this.lower();
    Bridge.instances.push(this);
  }

  static clearRegistry(): void {
    Bridge.instances = [];
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;

    if (this.active) {
      this.raise();
      SoundEffects.playRumble(this.sprite.scene);
    } else {
      this.lower();
      SoundEffects.playRumble(this.sprite.scene);
    }
  }

  private raise(): void {
    AssetManager.playAnimation(this.sprite, 'bridge_raising');
    this.sprite.once('animationcomplete', () => {
      AssetManager.playAnimation(this.sprite, 'bridge_raised');
    });
    // Remove from blocked cells list (now solid path)
    this.blockedCells.delete(`${this.col},${this.row}`);
  }

  private lower(): void {
    AssetManager.playAnimation(this.sprite, 'bridge_lowered');
    // Add to blocked cells list (empty gap)
    this.blockedCells.add(`${this.col},${this.row}`);
  }

  destroy(): void {
    this.sprite.destroy();
    this.blockedCells.delete(`${this.col},${this.row}`);
    const idx = Bridge.instances.indexOf(this);
    if (idx >= 0) {
      Bridge.instances.splice(idx, 1);
    }
  }
}
