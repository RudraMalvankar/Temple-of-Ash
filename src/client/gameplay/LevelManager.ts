import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Grid } from './Grid';
import { Player } from '../player/Player';
import { PushableCube } from './PushableCube';
import { PressurePlate } from './PressurePlate';
import { Door } from './Door';
import { Portal } from './Portal';
import { Checkpoint } from './Checkpoint';
import { AssetManager } from '../assets/AssetManager';
import { LEVELS } from '../levels/levelDefinitions';

export type LoadedLevel = {
  grid: Grid;
  player: Player;
  cubes: PushableCube[];
  plates: PressurePlate[];
  doors: Door[];
  portal: Portal | null;
  checkpoints: Checkpoint[];
};

export class LevelManager {
  private static scene: Scene | undefined;
  private static currentLevelIndex = 0;
  private static activeLevel: LoadedLevel | null = null;
  private static wallsGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private static debugText: Phaser.GameObjects.Text | null = null;
  
  // Player spawn coordinates (in grid cell coords)
  private static spawnCol = 0;
  private static spawnRow = 0;

  static loadLevel(scene: Scene, levelIndex: number, cellSize = 64): LoadedLevel {
    LevelManager.scene = scene;
    LevelManager.currentLevelIndex = levelIndex;
    
    // Clear registries
    PushableCube.clearRegistry();
    PressurePlate.clearRegistry();
    Door.clearRegistry();
    Checkpoint.clearRegistry();

    const levelDef = LEVELS[levelIndex];
    if (!levelDef) {
      throw new Error(`LevelManager: level definition index ${levelIndex} not found.`);
    }

    const grid = new Grid(levelDef.gridWidth, levelDef.gridHeight, cellSize);
    LevelManager.wallsGroup = scene.physics.add.staticGroup();
    const cubes: PushableCube[] = [];
    const plates: PressurePlate[] = [];
    const doors: Door[] = [];
    const checkpoints: Checkpoint[] = [];
    let portal: Portal | null = null;

    // Load layout
    for (let r = 0; r < levelDef.gridHeight; r++) {
      const rowStr = levelDef.layout[r] ?? "";
      const tokens = rowStr.split(' ');

      for (let c = 0; c < levelDef.gridWidth; c++) {
        const token = tokens[c] || 'W';
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;

        // Spawn floor first
        if (token !== 'W' && token !== 'L') {
          const floor = AssetManager.createTile(x, y, 0, scene);
          floor.setDisplaySize(cellSize, cellSize);
          floor.setDepth(0);
        }

        switch (token) {
          case 'W': {
            const wall = AssetManager.createTile(x, y, 12, scene);
            wall.setDisplaySize(cellSize, cellSize);
            LevelManager.wallsGroup.add(wall);
            grid.markBlocked(c, r, true);
            break;
          }
          case 'P': {
            LevelManager.spawnCol = c;
            LevelManager.spawnRow = r;
            break;
          }
          case 'C': {
            const cube = PushableCube.create(scene, {
              x,
              y,
              gridSize: cellSize,
              blockedCells: grid.getBlockedSet(),
            });
            cubes.push(cube);
            break;
          }
          case 'O': {
            const plate = new PressurePlate(scene, c, r, cellSize, () => {
              LevelManager.checkPuzzleProgress();
            });
            plates.push(plate);
            break;
          }
          case 'D': {
            const door = new Door(scene, c, r, cellSize, grid.getBlockedSet());
            doors.push(door);
            break;
          }
          case 'X': {
            portal = new Portal(scene, c, r, cellSize, () => {
              LevelManager.completeLevel();
            });
            break;
          }
          case 'K': {
            const checkpoint = new Checkpoint(scene, c, r, cellSize, (col, row) => {
              LevelManager.spawnCol = col;
              LevelManager.spawnRow = row;
            });
            checkpoints.push(checkpoint);
            break;
          }
          case 'T': {
            AssetManager.createTorch(x, y, scene);
            break;
          }
          case 'Y': {
            AssetManager.createCrystal(x, y, scene);
            break;
          }
          default:
            break;
        }
      }
    }

    // Spawn player at coordinates
    const player = Player.create(scene, {
      x: LevelManager.spawnCol * cellSize + cellSize / 2,
      y: LevelManager.spawnRow * cellSize + cellSize / 2,
      config: { gridSize: cellSize, moveSpeed: 220, cameraLerp: 0.1 },
      blockedCells: grid.getBlockedSet(),
    });

    LevelManager.activeLevel = {
      grid,
      player,
      cubes,
      plates,
      doors,
      portal,
      checkpoints,
    };

    // Physics setup
    scene.physics.add.collider(player.sprite, LevelManager.wallsGroup);
    player.bindCamera(scene.cameras.main);

    for (const cube of cubes) {
      scene.physics.add.collider(player.sprite, cube.sprite, () => {
        const body = player.sprite.body;
        if (body) {
          cube.handlePlayerCollide(body);
        }
      });
      scene.physics.add.collider(cube.sprite, LevelManager.wallsGroup);
      for (const other of cubes) {
        if (other !== cube) {
          scene.physics.add.collider(cube.sprite, other.sprite);
        }
      }
    }

    // Initialize state
    LevelManager.checkPuzzleProgress();

    // Create debug HUD text
    if (LevelManager.debugText) {
      LevelManager.debugText.destroy();
    }
    LevelManager.debugText = scene.add.text(16, 12, '', {
      fontFamily: 'Courier',
      fontSize: '13px',
      color: '#f0d2b0',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 6 },
    }).setScrollFactor(0).setDepth(3000);

    return LevelManager.activeLevel;
  }

  static update(playerCol: number, playerRow: number): void {
    if (!LevelManager.activeLevel) return;

    const { plates, portal, checkpoints, cubes } = LevelManager.activeLevel;

    // Update plates states
    for (const plate of plates) {
      plate.update(playerCol, playerRow, cubes);
    }

    // Update portal state
    if (portal) {
      portal.update(playerCol, playerRow);
    }

    // Update checkpoints
    for (const cp of checkpoints) {
      cp.update(playerCol, playerRow);
    }

    // Update Debug Text HUD
    const activePlates = plates.filter(p => p.isPressed()).length;
    const portalState = portal ? (portal.isActive() ? 'ACTIVE' : 'INACTIVE') : 'N/A';
    const doorState = LevelManager.activeLevel.doors.length > 0 
      ? (LevelManager.activeLevel.doors.every(d => d.isOpen()) ? 'OPEN' : 'CLOSED') 
      : 'N/A';

    LevelManager.debugText?.setText(
      [
        `LEVEL: ${LEVELS[LevelManager.currentLevelIndex]?.name ?? 'Unknown'}`,
        `PLAYER TILE: (${playerCol}, ${playerRow})`,
        `PLATES PRESSED: ${activePlates}/${plates.length}`,
        `DOOR STATE: ${doorState}`,
        `PORTAL STATE: ${portalState}`,
      ].join('\n')
    );
  }

  static handlePlayerDeath(): void {
    if (!LevelManager.activeLevel || !LevelManager.scene) return;
    const { player } = LevelManager.activeLevel;
    const cellSize = 64;

    // Respawn at the latest registered spawn coordinates
    const toX = LevelManager.spawnCol * cellSize + cellSize / 2;
    const toY = LevelManager.spawnRow * cellSize + cellSize / 2;
    
    player.sprite.setPosition(toX, toY);
    if (player.sprite.body) {
      player.sprite.body.reset(toX, toY);
    }
  }

  private static checkPuzzleProgress(): void {
    if (!LevelManager.activeLevel) return;
    const { plates, doors, portal } = LevelManager.activeLevel;

    const allPressed = plates.length > 0 ? plates.every(p => p.isPressed()) : true;

    // Open doors if all plates pressed
    for (const door of doors) {
      door.setOpen(allPressed);
    }

    // Activate exit portal if doors are open / plates pressed
    if (portal) {
      portal.setActive(allPressed);
    }
  }

  private static completeLevel(): void {
    const scene = LevelManager.scene;
    if (!scene) return;

    scene.cameras.main.fadeOut(800, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      const nextIndex = LevelManager.currentLevelIndex + 1;
      if (nextIndex < LEVELS.length) {
        // Load next level definition
        LevelManager.loadLevel(scene, nextIndex);
      } else {
        // Game completed, return to Main Menu
        scene.scene.start('MainMenu');
      }
    });
  }

  static shutdown(): void {
    PushableCube.clearRegistry();
    PressurePlate.clearRegistry();
    Door.clearRegistry();
    Checkpoint.clearRegistry();
    LevelManager.activeLevel = null;
    LevelManager.wallsGroup = null;
    LevelManager.debugText = null;
    LevelManager.scene = undefined;
  }
}
