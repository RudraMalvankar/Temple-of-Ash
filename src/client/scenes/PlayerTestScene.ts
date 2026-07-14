import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Player } from '../player/Player';
import { createPlayerTestArena } from '../player/PlayerTestArena';
import { EventBus } from '../core/EventBus';

/**
 * Feel-validation sandbox: Player + Walls + Camera + Lava + Portal.
 * No puzzle systems.
 */
export class PlayerTestScene extends Scene {
  private player: Player | undefined;

  constructor() {
    super('PlayerTestScene');
  }

  create(): void {
    EventBus.clear();

    const arena = createPlayerTestArena(this);
    this.player = Player.create(this, {
      x: 280,
      y: 280,
      config: {
        moveSpeed: 230,
        cameraLerp: 0.09,
      },
    });

    this.physics.add.collider(this.player.sprite, arena.walls);
    this.player.bindCamera(this.cameras.main);

    this.add
      .text(16, 12, 'PLAYER TEST  ·  WASD / Arrows  ·  Touch stick', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#f0d2b0',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(3000);

    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.onResize();
  }

  override update(_time: number, delta: number): void {
    this.player?.update(delta);
  }

  private handleShutdown = (): void => {
    this.scale.off('resize', this.onResize, this);
    this.player?.destroy();
    this.player = undefined;
    EventBus.clear();
  };

  private onResize = (): void => {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);
  };
}
