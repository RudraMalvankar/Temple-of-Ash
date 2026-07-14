import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Grid } from './Grid';
import { Player } from '../player/Player';
import { PushableCube } from './PushableCube';
import { PressurePlate } from './PressurePlate';
import { Door } from './Door';
import { Portal } from './Portal';
import { Checkpoint } from './Checkpoint';
import { Laser } from './Laser';
import { Bridge } from './Bridge';
import { Crystal } from './Crystal';
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
  lasers: Laser[];
  bridges: Bridge[];
  crystals: Crystal[];
};

export class LevelManager {
  private static scene: Scene | undefined;
  private static currentLevelIndex = 0;
  private static activeLevel: LoadedLevel | null = null;
  private static wallsGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private static debugText: Phaser.GameObjects.Text | null = null;
  private static debugVisible = true;
  private static isTransitioning = false;

  // Active spawn coordinates (saved at checkpoint activation, else defaults to original spawn)
  private static spawnCol = 0;
  private static spawnRow = 0;
  private static originalSpawnCol = 0;
  private static originalSpawnRow = 0;

  static loadLevel(scene: Scene, levelIndex: number, cellSize = 64, useCheckpoint = false): LoadedLevel {
    LevelManager.scene = scene;
    LevelManager.currentLevelIndex = levelIndex;
    LevelManager.isTransitioning = false;
    
    // Clear registries
    PushableCube.clearRegistry();
    PressurePlate.clearRegistry();
    Door.clearRegistry();
    Checkpoint.clearRegistry();
    Laser.clearRegistry();
    Bridge.clearRegistry();
    Crystal.clearRegistry();

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
    const lasers: Laser[] = [];
    const bridges: Bridge[] = [];
    const crystals: Crystal[] = [];
    let portal: Portal | null = null;

    // Load layout
    for (let r = 0; r < levelDef.gridHeight; r++) {
      const rowStr = levelDef.layout[r] ?? "";
      const tokens = rowStr.split(' ');

      for (let c = 0; c < levelDef.gridWidth; c++) {
        const token = tokens[c] || 'W';
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;

        // Spawn floor first unless it is a wall boundary
        if (token !== 'W') {
          const floor = AssetManager.createTile(x, y, 0, scene);
          floor.setDisplaySize(cellSize, cellSize);
          floor.setDepth(0);
        }

        if (token === 'L') {
          // Spawn lava tile
          const lava = AssetManager.spawnLava(scene, x, y, 'a');
          lava.setDisplaySize(cellSize, cellSize);
          grid.markLava(c, r);
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
            if (!useCheckpoint) {
              LevelManager.originalSpawnCol = c;
              LevelManager.originalSpawnRow = r;
              LevelManager.spawnCol = c;
              LevelManager.spawnRow = r;
            }
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
          case 'H': {
            const laser = new Laser(scene, c, r, cellSize, 'horizontal');
            lasers.push(laser);
            break;
          }
          case 'V': {
            const laser = new Laser(scene, c, r, cellSize, 'vertical');
            lasers.push(laser);
            break;
          }
          case 'B': {
            const bridge = new Bridge(scene, c, r, cellSize, grid.getBlockedSet());
            bridges.push(bridge);
            break;
          }
          case 'Y': {
            const crystal = new Crystal(scene, c, r, cellSize);
            crystals.push(crystal);
            break;
          }
          case 'T': {
            AssetManager.createTorch(x, y, scene);
            break;
          }
          default:
            break;
        }
      }
    }

    // Spawn player at active coordinates
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
      lasers,
      bridges,
      crystals,
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

    // Keyboard bindings for resets & shortcuts
    scene.input.keyboard?.removeAllKeys();
    
    const rKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    rKey?.on('down', () => LevelManager.resetLevel(false));

    const lKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    lKey?.on('down', () => {
      const nextIndex = LevelManager.currentLevelIndex + 1;
      if (nextIndex < LEVELS.length) {
        LevelManager.loadLevel(scene, nextIndex);
      }
    });

    const kKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    kKey?.on('down', () => {
      const prevIndex = LevelManager.currentLevelIndex - 1;
      if (prevIndex >= 0) {
        LevelManager.loadLevel(scene, prevIndex);
      }
    });

    const f1Key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    f1Key?.on('down', () => {
      LevelManager.debugVisible = !LevelManager.debugVisible;
      LevelManager.debugText?.setVisible(LevelManager.debugVisible);
    });

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
    LevelManager.debugText.setVisible(LevelManager.debugVisible);

    return LevelManager.activeLevel;
  }

  static update(playerCol: number, playerRow: number): void {
    if (!LevelManager.activeLevel || LevelManager.isTransitioning) return;

    const { grid, plates, portal, checkpoints, cubes, lasers, crystals } = LevelManager.activeLevel;

    // 1. Lava step-on check (Stepping onto lava kills the player)
    if (grid.isLava(playerCol, playerRow)) {
      LevelManager.killPlayer();
      return;
    }

    // 2. Check if cubes fell into lava
    for (const cube of [...cubes]) {
      const cell = cube.getGridCell();
      if (grid.isLava(cell.col, cell.row)) {
        cube.burn();
        // Remove cube from active list immediately
        const idx = cubes.indexOf(cube);
        if (idx >= 0) {
          cubes.splice(idx, 1);
        }
      }
    }

    // 3. Update plates states
    for (const plate of plates) {
      plate.update(playerCol, playerRow, cubes);
    }

    // 4. Update lasers projections
    for (const laser of lasers) {
      laser.update(playerCol, playerRow, grid.width, grid.height, grid.getBlockedSet(), cubes, 64);
      
      // Touching laser beam kills the player
      if (laser.hasCell(playerCol, playerRow)) {
        LevelManager.killPlayer();
        return;
      }
    }

    // 5. Update crystal objective triggers
    for (const crystal of crystals) {
      const laserHit = lasers.some(l => l.hasCell(crystal.col, crystal.row));
      crystal.update(playerCol, playerRow, cubes, laserHit);
    }

    // 6. Update portal state
    if (portal) {
      portal.update(playerCol, playerRow);
    }

    // 7. Update checkpoints
    for (const cp of checkpoints) {
      cp.update(playerCol, playerRow);
    }

    // Update Debug Text HUD
    const activePlates = plates.filter(p => p.isPressed()).length;
    const activeCrystals = crystals.filter(c => c.isActivated()).length;
    const portalState = portal ? (portal.isActive() ? 'ACTIVE' : 'INACTIVE') : 'N/A';
    const doorState = LevelManager.activeLevel.doors.length > 0 
      ? (LevelManager.activeLevel.doors.every(d => d.isOpen()) ? 'OPEN' : 'CLOSED') 
      : 'N/A';

    LevelManager.debugText?.setText(
      [
        `LEVEL: ${LEVELS[LevelManager.currentLevelIndex]?.name ?? 'Unknown'}`,
        `PLAYER TILE: (${playerCol}, ${playerRow})`,
        `PLATES PRESSED: ${activePlates}/${plates.length}`,
        `CRYSTALS ACTIVE: ${activeCrystals}/${crystals.length}`,
        `DOOR STATE: ${doorState}`,
        `PORTAL STATE: ${portalState}`,
        `HOTKEYS: R = Reset, L = Next Level, K = Prev Level, F1 = HUD`,
      ].join('\n')
    );
  }

  static killPlayer(): void {
    if (LevelManager.isTransitioning || !LevelManager.scene) return;
    LevelManager.isTransitioning = true;

    console.log('[LevelManager] Player died! Respawing at latest checkpoint...');
    const scene = LevelManager.scene;

    // Camera shake & Fade out
    scene.cameras.main.shake(300, 0.02);
    scene.cameras.main.fadeOut(400, 0, 0, 0);

    scene.cameras.main.once('camerafadeoutcomplete', () => {
      // Restore puzzle state but preserve checkpoint spawn position
      LevelManager.resetLevel(true);
      scene.cameras.main.fadeIn(400, 0, 0, 0);
    });
  }

  static resetLevel(useCheckpoint = false): void {
    if (!LevelManager.scene) return;
    
    if (!useCheckpoint) {
      // Clear checkpoint saved position back to start spawn
      LevelManager.spawnCol = LevelManager.originalSpawnCol;
      LevelManager.spawnRow = LevelManager.originalSpawnRow;
    }

    LevelManager.loadLevel(LevelManager.scene, LevelManager.currentLevelIndex, 64, true);
  }

  private static checkPuzzleProgress(): void {
    if (!LevelManager.activeLevel) return;
    const { plates, doors, portal, bridges } = LevelManager.activeLevel;

    const allPressed = plates.length > 0 ? plates.every(p => p.isPressed()) : true;

    // Toggle doors
    for (const door of doors) {
      door.setOpen(allPressed);
    }

    // Toggle bridges
    for (const bridge of bridges) {
      bridge.setActive(allPressed);
    }

    // Activate exit portal
    if (portal) {
      portal.setActive(allPressed);
    }
  }

  private static completeLevel(): void {
    const scene = LevelManager.scene;
    if (!scene || LevelManager.isTransitioning) return;
    LevelManager.isTransitioning = true;

    console.log('[LevelManager] Level completed! Loading next...');

    scene.cameras.main.fadeOut(800, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
      const nextIndex = LevelManager.currentLevelIndex + 1;
      if (nextIndex < LEVELS.length) {
        LevelManager.loadLevel(scene, nextIndex);
      } else {
        // Returned to title screen upon final completion
        scene.scene.start('MainMenu');
      }
    });
  }

  static shutdown(): void {
    PushableCube.clearRegistry();
    PressurePlate.clearRegistry();
    Door.clearRegistry();
    Checkpoint.clearRegistry();
    Laser.clearRegistry();
    Bridge.clearRegistry();
    Crystal.clearRegistry();
    LevelManager.activeLevel = null;
    LevelManager.wallsGroup = null;
    LevelManager.debugText = null;
    LevelManager.scene = undefined;
    LevelManager.isTransitioning = false;
  }
}
