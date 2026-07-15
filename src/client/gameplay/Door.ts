import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { SoundEffects } from '../core/SoundEffects';

export class Door {
  static instances: Door[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private open = false;
  private blockedCells: Set<string>;
  private originalY: number;

  constructor(scene: Scene, col: number, row: number, gridSize: number, blockedCells: Set<string>) {
    this.col = col;
    this.row = row;
    this.blockedCells = blockedCells;

    const x = col * gridSize + gridSize / 2;
    this.originalY = (row + 1) * gridSize; // bottom of the grid cell

    this.sprite = AssetManager.spawnDoor(scene, x, this.originalY);
    this.sprite.setDisplaySize(gridSize, gridSize * 2);
    this.sprite.setOrigin(0.5, 1.0); // bottom anchor
    this.sprite.setDepth(5);

    // Start closed and block coordinates
    this.close();
    Door.instances.push(this);
  }

  static clearRegistry(): void {
    Door.instances = [];
  }

  isOpen(): boolean {
    return this.open;
  }

  setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;

    if (this.open) {
      AssetManager.playDoor(this.sprite, 'open');
      SoundEffects.playDoor(this.sprite.scene);
      this.blockedCells.delete(`${this.col},${this.row}`);
      
      // Animate sliding upward and fading away
      this.sprite.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        y: this.originalY - 24,
        duration: 400,
        ease: 'Cubic.Out'
      });
    } else {
      this.close();
    }
  }

  private close(): void {
    this.open = false;
    AssetManager.playDoor(this.sprite, 'closed');
    this.blockedCells.add(`${this.col},${this.row}`);
    this.sprite.alpha = 1.0;
    this.sprite.y = this.originalY;
  }

  destroy(): void {
    this.sprite.destroy();
    this.blockedCells.delete(`${this.col},${this.row}`);
    const idx = Door.instances.indexOf(this);
    if (idx >= 0) {
      Door.instances.splice(idx, 1);
    }
  }
}
