import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { SoundEffects } from '../core/SoundEffects';
import type { PushableCube } from './PushableCube';

export class Crystal {
  static instances: Crystal[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private activated = false;
  private onStateChange: (() => void) | undefined;

  constructor(scene: Scene, col: number, row: number, gridSize: number, onStateChange?: () => void) {
    this.col = col;
    this.row = row;
    this.onStateChange = onStateChange;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.sprite = AssetManager.spawnCrystal(scene, x, y);
    this.sprite.setDisplaySize(gridSize, gridSize);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(7);

    Crystal.instances.push(this);
  }

  static clearRegistry(): void {
    Crystal.instances = [];
  }

  isActivated(): boolean {
    return this.activated;
  }

  setActivated(active: boolean): void {
    if (this.activated === active) return;
    this.activated = active;
    AssetManager.playCrystal(this.sprite, this.activated);
    if (active) {
      SoundEffects.playClick(this.sprite.scene);
      if (this.onStateChange) {
        this.onStateChange();
      }
    }
  }

  update(playerCol: number, playerRow: number, cubes: PushableCube[], laserHit: boolean): void {
    if (this.activated) return;

    // Check if player, cube or laser is overlapping this crystal
    const playerOverlap = playerCol === this.col && playerRow === this.row;
    const cubeOverlap = cubes.some(c => c.getGridCell().col === this.col && c.getGridCell().row === this.row);
    
    if (playerOverlap || cubeOverlap || laserHit) {
      this.setActivated(true);
    }
  }

  destroy(): void {
    this.sprite.destroy();
    const idx = Crystal.instances.indexOf(this);
    if (idx >= 0) {
      Crystal.instances.splice(idx, 1);
    }
  }
}
