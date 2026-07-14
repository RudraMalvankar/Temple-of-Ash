import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Player } from '../player/Player';
import { PushableCube } from '../gameplay/PushableCube';
import { AssetManager } from '../assets/AssetManager';
import { EventBus } from '../core/EventBus';

const GRID = 64;

/**
 * PushableCube feel test: Player + Walls + 3 Cubes + Portal.
 */
export class PushTestScene extends Scene {
  private player: Player | undefined;
  private cubes: PushableCube[] = [];

  constructor() {
    super('PushTestScene');
  }

  create(): void {
    EventBus.clear();
    PushableCube.clearRegistry();

    const worldW = 18 * GRID;
    const worldH = 12 * GRID;
    const blocked = new Set<string>();

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBackgroundColor(0x140e0c);
    this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH, 0x1a1412).setDepth(0);

    const walls = this.physics.add.staticGroup();
    const markBlocked = (col: number, row: number) => {
      blocked.add(`${col},${row}`);
    };

    const addWallCell = (col: number, row: number) => {
      const x = col * GRID + GRID / 2;
      const y = row * GRID + GRID / 2;
      const wall = this.add.rectangle(x, y, GRID, GRID, 0x2a2420).setStrokeStyle(2, 0x3d342e);
      walls.add(wall);
      markBlocked(col, row);
    };

    // Border
    for (let c = 0; c < 18; c += 1) {
      addWallCell(c, 0);
      addWallCell(c, 11);
    }
    for (let r = 1; r < 11; r += 1) {
      addWallCell(0, r);
      addWallCell(17, r);
    }

    // Interior blockers
    addWallCell(5, 4);
    addWallCell(5, 5);
    addWallCell(10, 7);
    addWallCell(11, 7);
    addWallCell(12, 3);
    walls.refresh();

    this.player = Player.create(this, {
      x: 3 * GRID + GRID / 2,
      y: 3 * GRID + GRID / 2,
      config: { gridSize: GRID, moveSpeed: 220, cameraLerp: 0.1 },
    });
    this.physics.add.collider(this.player.sprite, walls);
    this.player.bindCamera(this.cameras.main);

    const cubeSpawns = [
      { x: 7 * GRID + GRID / 2, y: 4 * GRID + GRID / 2, id: 'push_a' },
      { x: 8 * GRID + GRID / 2, y: 6 * GRID + GRID / 2, id: 'push_b' },
      { x: 12 * GRID + GRID / 2, y: 5 * GRID + GRID / 2, id: 'push_c' },
    ];

    this.cubes = cubeSpawns.map((spawn) =>
      PushableCube.create(this, {
        x: spawn.x,
        y: spawn.y,
        id: spawn.id,
        gridSize: GRID,
        blockedCells: blocked,
      })
    );

    for (const cube of this.cubes) {
      this.physics.add.collider(this.player.sprite, cube.sprite, () => {
        const body = this.player?.sprite.body;
        if (body) {
          cube.handlePlayerCollide(body);
        }
      });
      this.physics.add.collider(cube.sprite, walls);
      for (const other of this.cubes) {
        if (other !== cube) {
          this.physics.add.collider(cube.sprite, other.sprite);
        }
      }
    }

    const portal = AssetManager.createPortal(15 * GRID + GRID / 2, 9 * GRID + GRID / 2, this);
    portal.setScale(0.32);
    portal.setDepth(2);

    this.add
      .text(16, 12, 'PUSH TEST  ·  Walk into cubes to shove one tile', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#f0d2b0',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(3000);

    EventBus.onCubeMoved((payload) => {
      // Keep a tiny debug pulse so plate compatibility is obvious in playtest.
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
