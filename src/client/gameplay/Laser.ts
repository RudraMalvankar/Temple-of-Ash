import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { PushableCube } from './PushableCube';

export class Laser {
  static instances: Laser[] = [];

  readonly emitterSprite: Phaser.GameObjects.Sprite;
  readonly col: number;
  readonly row: number;
  readonly orientation: 'horizontal' | 'vertical';
  
  private beamGraphics: Phaser.GameObjects.Graphics;
  private coveredCells = new Set<string>();

  constructor(scene: Scene, col: number, row: number, gridSize: number, orientation: 'horizontal' | 'vertical') {
    this.col = col;
    this.row = row;
    this.orientation = orientation;

    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    this.emitterSprite = AssetManager.spawnLaser(scene, x, y, orientation);
    this.emitterSprite.setDepth(6);

    this.beamGraphics = scene.add.graphics();
    this.beamGraphics.setDepth(5);

    Laser.instances.push(this);
  }

  static clearRegistry(): void {
    for (const inst of Laser.instances) {
      inst.beamGraphics.destroy();
    }
    Laser.instances = [];
  }

  update(_playerCol: number, _playerRow: number, gridWidth: number, gridHeight: number, blockedCells: Set<string>, cubes: PushableCube[], gridSize: number): void {
    this.beamGraphics.clear();
    this.coveredCells.clear();

    const dCol = this.orientation === 'horizontal' ? 1 : 0;
    const dRow = this.orientation === 'vertical' ? 1 : 0;

    // Projection loop (bi-directional: right/down, left/up)
    const project = (stepX: number, stepY: number) => {
      let curCol = this.col + stepX;
      let curRow = this.row + stepY;

      while (curCol >= 0 && curCol < gridWidth && curRow >= 0 && curRow < gridHeight) {
        const key = `${curCol},${curRow}`;

        // Hits wall
        if (blockedCells.has(key)) {
          break;
        }

        // Hits cube
        const hitCube = cubes.some(c => c.getGridCell().col === curCol && c.getGridCell().row === curRow);
        if (hitCube) {
          break;
        }

        this.coveredCells.add(key);

        curCol += stepX;
        curRow += stepY;
      }
    };

    project(dCol, dRow);
    project(-dCol, -dRow);

    // Draw laser beam visual effect (Orange/red thick line with yellow core glow)
    if (this.coveredCells.size > 0) {
      this.beamGraphics.lineStyle(4, 0xff3300, 0.7);
      for (const cellKey of this.coveredCells) {
        const parts = cellKey.split(',');
        const c = Number(parts[0] || 0);
        const r = Number(parts[1] || 0);
        const cx = c * gridSize + gridSize / 2;
        const cy = r * gridSize + gridSize / 2;

        this.beamGraphics.strokeRect(cx - 2, cy - 2, 4, 4); // small glow node center
        
        // draw line segment along orientation
        if (this.orientation === 'horizontal') {
          this.beamGraphics.lineBetween(cx - gridSize / 2, cy, cx + gridSize / 2, cy);
        } else {
          this.beamGraphics.lineBetween(cx, cy - gridSize / 2, cx, cy + gridSize / 2);
        }
      }
    }
  }

  hasCell(col: number, row: number): boolean {
    return this.coveredCells.has(`${col},${row}`);
  }

  destroy(): void {
    this.emitterSprite.destroy();
    this.beamGraphics.destroy();
    const idx = Laser.instances.indexOf(this);
    if (idx >= 0) {
      Laser.instances.splice(idx, 1);
    }
  }
}
