import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { Player } from '../player/Player';
import { PushableCube } from './PushableCube';
import { Grid } from './Grid';
import type { LevelDefinition } from '../levels/levelDefinitions';

export type LoadedLevel = {
  grid: Grid;
  player: Player;
  cubes: PushableCube[];
  wallsGroup: Phaser.Physics.Arcade.StaticGroup;
  torches: Phaser.GameObjects.Sprite[];
  lavaGroup: Phaser.Physics.Arcade.StaticGroup;
  spawnX: number;
  spawnY: number;
};

export class LevelLoader {
  static load(scene: Scene, level: LevelDefinition, cellSize = 64): LoadedLevel {
    console.log(`[LevelLoader] Loading level: "${level.name}"`);
    
    const grid = new Grid(level.gridWidth, level.gridHeight, cellSize);
    const wallsGroup = scene.physics.add.staticGroup();
    const lavaGroup = scene.physics.add.staticGroup();
    const cubes: PushableCube[] = [];
    const torches: Phaser.GameObjects.Sprite[] = [];
    
    let spawnX = cellSize * 2 + cellSize / 2;
    let spawnY = cellSize * 2 + cellSize / 2;

    // First pass: lay down floor tiles everywhere except lava/void
    for (let r = 0; r < level.gridHeight; r++) {
      const rowStr = level.layout[r] ?? "";
      const tokens = rowStr.split(' ');
      
      for (let c = 0; c < level.gridWidth; c++) {
        const token = tokens[c] || 'W';
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;

        if (token === 'L') {
          // Spawn lava tile
          const lava = AssetManager.createTile(x, y, 49, scene); // frameIndex 49 is lava_flow_a_01
          lava.setDisplaySize(cellSize, cellSize);
          lavaGroup.add(lava);
          grid.markLava(c, r);
        } else {
          // Spawn normal floor tile
          const floor = AssetManager.createTile(x, y, 0, scene); // frameIndex 0 is floor_tile_01
          floor.setDisplaySize(cellSize, cellSize);
          floor.setDepth(0);
        }
      }
    }

    // Second pass: spawn interactive and structural objects
    for (let r = 0; r < level.gridHeight; r++) {
      const rowStr = level.layout[r] ?? "";
      const tokens = rowStr.split(' ');

      for (let c = 0; c < level.gridWidth; c++) {
        const token = tokens[c] || 'W';
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;

        switch (token) {
          case 'W': {
            const wall = AssetManager.createTile(x, y, 12, scene); // frameIndex 12 is wall_tile_01
            wall.setDisplaySize(cellSize, cellSize);
            wallsGroup.add(wall);
            grid.markBlocked(c, r, true);
            break;
          }
          case 'P': {
            spawnX = x;
            spawnY = y;
            break;
          }
          case 'C': {
            // PushableCube handles registration internally
            const cube = PushableCube.create(scene, {
              x,
              y,
              gridSize: cellSize,
              blockedCells: grid.getBlockedSet(),
            });
            cubes.push(cube);
            break;
          }
          case 'T': {
            const torch = AssetManager.createTorch(x, y, scene);
            torch.setScale(0.8);
            torch.setDepth(2);
            torches.push(torch);
            break;
          }
          default:
            break;
        }
      }
    }

    // Spawn player at coordinates
    const player = Player.create(scene, {
      x: spawnX,
      y: spawnY,
      config: { gridSize: cellSize, moveSpeed: 220, cameraLerp: 0.1 },
      blockedCells: grid.getBlockedSet(),
    });

    return {
      grid,
      player,
      cubes,
      wallsGroup,
      torches,
      lavaGroup,
      spawnX,
      spawnY
    };
  }
}
