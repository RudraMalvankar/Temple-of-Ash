import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';

export class Door {
  static instances: Door[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private open = false;
  private blockedCells: Set<string>;

  constructor(scene: Scene, col: number, row: number, gridSize: number, blockedCells: Set<string>) {
    this.col = col;
    this.row = row;
    this.blockedCells = blockedCells;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.sprite = AssetManager.spawnDoor(scene, x, y);
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
      this.blockedCells.delete(`${this.col},${this.row}`);
    } else {
      this.close();
    }
  }

  private close(): void {
    this.open = false;
    AssetManager.playDoor(this.sprite, 'closed');
    this.blockedCells.add(`${this.col},${this.row}`);
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
