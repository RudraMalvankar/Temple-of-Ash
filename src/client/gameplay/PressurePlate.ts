import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';

export class PressurePlate {
  static instances: PressurePlate[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  private pressed = false;
  private onStateChange: (pressed: boolean) => void;

  constructor(
    scene: Scene,
    col: number,
    row: number,
    gridSize: number,
    onStateChange: (pressed: boolean) => void
  ) {
    this.col = col;
    this.row = row;
    this.onStateChange = onStateChange;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.sprite = AssetManager.spawnPressurePlate(scene, x, y);
    this.sprite.setDisplaySize(gridSize, gridSize);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(2); // Sit above floor but below player/cubes

    PressurePlate.instances.push(this);
  }

  static clearRegistry(): void {
    PressurePlate.instances = [];
  }

  isPressed(): boolean {
    return this.pressed;
  }

  update(playerCol: number, playerRow: number, cubes: any[]): void {
    // Check if player is on top of this plate
    let isOccupied = playerCol === this.col && playerRow === this.row;

    // Check if any cube is on top of this plate
    if (!isOccupied) {
      isOccupied = cubes.some(
        (cube) => {
          const cell = cube.getGridCell();
          return cell.col === this.col && cell.row === this.row;
        }
      );
    }

    if (isOccupied !== this.pressed) {
      this.pressed = isOccupied;
      if (this.pressed) {
        AssetManager.playPressurePlate(this.sprite, 'activated');
      } else {
        AssetManager.playPressurePlate(this.sprite, 'idle');
      }
      this.onStateChange(this.pressed);
    }
  }

  destroy(): void {
    this.sprite.destroy();
    const idx = PressurePlate.instances.indexOf(this);
    if (idx >= 0) {
      PressurePlate.instances.splice(idx, 1);
    }
  }
}
