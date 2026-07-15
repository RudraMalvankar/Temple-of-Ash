import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Player } from '../player/Player';
import { LevelManager } from '../gameplay/LevelManager';
import { LEVELS } from '../levels/levelDefinitions';
import { EventBus } from '../core/EventBus';

const GRID = 64;

/**
 * Main game playtest scene driven by the modular LevelManager.
 */
export class PushTestScene extends Scene {
  private player: Player | undefined;
  private currentLevelIndex = 0;

  constructor() {
    super('PushTestScene');
  }

  create(): void {
    EventBus.clear();
    LevelManager.shutdown();

    const levelDef = LEVELS[this.currentLevelIndex];
    if (!levelDef) {
      console.warn(`Level index ${this.currentLevelIndex} not found!`);
      return;
    }

    const worldW = levelDef.gridWidth * GRID;
    const worldH = levelDef.gridHeight * GRID;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBackgroundColor(0x140e0c);

    // Initialize and load level structure via modular LevelManager
    const loaded = LevelManager.loadLevel(this, this.currentLevelIndex, GRID);
    this.player = loaded.player;

    EventBus.onCubeMoved((payload) => {
      console.log(`[cubeMoved] ${payload.cubeId} → (${payload.toCol},${payload.toRow})`);
    });

    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.onResize();
  }

  override update(_time: number, delta: number): void {
    if (!this.player) return;
    this.player.update(delta);

    const pos = this.player.getGridPosition();
    LevelManager.update(pos.col, pos.row);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.onResize, this);
    LevelManager.shutdown();
    this.player = undefined;
    EventBus.clear();
  };

  private onResize = (): void => {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);

    const levelDef = LEVELS[this.currentLevelIndex];
    if (levelDef) {
      const worldW = levelDef.gridWidth * GRID;
      const worldH = levelDef.gridHeight * GRID;
      const zoomX = width / (worldW + 64);
      const zoomY = height / (worldH + 64);
      const zoom = Math.min(zoomX, zoomY, 1.5);

      this.cameras.main.setZoom(zoom);
      this.cameras.main.centerOn(worldW / 2, worldH / 2);
    }
  };
}
