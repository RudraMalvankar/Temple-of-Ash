import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Player } from '../player/Player';
import { PushableCube } from '../gameplay/PushableCube';
import { LevelLoader } from '../gameplay/LevelLoader';
import { LEVELS } from '../levels/levelDefinitions';
import { EventBus } from '../core/EventBus';

const GRID = 64;

/**
 * Main game playtest scene utilizing modular LevelLoader and Grid systems.
 */
export class PushTestScene extends Scene {
  private player: Player | undefined;
  private cubes: PushableCube[] = [];
  private currentLevelIndex = 0;

  constructor() {
    super('PushTestScene');
  }

  create(): void {
    EventBus.clear();
    PushableCube.clearRegistry();

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

    // Load the handcrafted level using LevelLoader
    const loaded = LevelLoader.load(this, levelDef, GRID);
    this.player = loaded.player;
    this.cubes = loaded.cubes;

    // Setup physics colliders
    this.physics.add.collider(this.player.sprite, loaded.wallsGroup);
    this.player.bindCamera(this.cameras.main);

    for (const cube of this.cubes) {
      // Player pushes cube
      this.physics.add.collider(this.player.sprite, cube.sprite, () => {
        const body = this.player?.sprite.body;
        if (body) {
          cube.handlePlayerCollide(body);
        }
      });
      // Cubes collide with walls
      this.physics.add.collider(cube.sprite, loaded.wallsGroup);
      // Cubes collide with other cubes
      for (const other of this.cubes) {
        if (other !== cube) {
          this.physics.add.collider(cube.sprite, other.sprite);
        }
      }
    }

    this.add
      .text(16, 12, `LEVEL: ${levelDef.name}  ·  Grid & LevelLoader Active`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#f0d2b0',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(3000);

    EventBus.onCubeMoved((payload) => {
      console.log(`[cubeMoved] ${payload.cubeId} → (${payload.toCol},${payload.toRow})`);
    });

    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.onResize();
  }

  override update(_time: number, delta: number): void {
    this.player?.update(delta);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.onResize, this);
    for (const cube of this.cubes) {
      cube.destroy();
    }
    this.cubes = [];
    PushableCube.clearRegistry();
    this.player?.destroy();
    this.player = undefined;
    EventBus.clear();
  };

  private onResize = (): void => {
    this.cameras.resize(this.scale.width, this.scale.height);
  };
}
