import type { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { EventBus } from '../core/EventBus';
import type { PlayerConfig } from './PlayerConfig';
import type { InputVector } from './PlayerInput';
import { PushableCube } from '../gameplay/PushableCube';
import {
  PlayerStateId,
  createInitialPlayerState,
  type PlayerRuntimeState,
  type PlayerStateIdValue,
} from './PlayerState';

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

/**
 * Grid-locked step-by-step movement controller for the player cube.
 * Supports Sokoban-style interaction with PushableCubes and wall blockages.
 */
export class PlayerController {
  readonly state: PlayerRuntimeState;
  private moving = false;
  private moveTween: Phaser.Tweens.Tween | undefined;

  constructor(
    private readonly scene: Scene,
    private readonly sprite: ArcadeSprite,
    private readonly config: PlayerConfig,
    private readonly blockedCells?: Set<string>
  ) {
    this.state = createInitialPlayerState(sprite.x, sprite.y, config.gridSize);
    this.configureBody();
  }

  /**
   * @returns dummy state to match animator/game loop expectation
   */
  update(_deltaMs: number, input: InputVector): { shouldSquash: boolean; impacted: boolean } {
    if (this.moving) {
      return { shouldSquash: false, impacted: false };
    }

    if (input.active) {
      // Determine dominant cardinal direction of input
      let dirX = 0;
      let dirY = 0;
      if (Math.abs(input.x) > Math.abs(input.y)) {
        dirX = Math.sign(input.x);
      } else {
        dirY = Math.sign(input.y);
      }

      if (dirX !== 0 || dirY !== 0) {
        const toCol = this.state.gridCol + dirX;
        const toRow = this.state.gridRow + dirY;

        let canMove = true;

        // Check wall boundaries
        if (this.blockedCells && this.blockedCells.has(`${toCol},${toRow}`)) {
          canMove = false;
        }

        // Check if cell is occupied by a pushable block
        if (canMove) {
          const cube = PushableCube.instances.find(
            (c) => c.getGridCell().col === toCol && c.getGridCell().row === toRow
          );
          if (cube) {
            // Attempt to push the block in the direction of player movement
            const pushed = cube.tryPush(dirX, dirY);
            if (!pushed) {
              canMove = false;
            }
          }
        }

        if (canMove) {
          this.startSlide(toCol, toRow, dirX, dirY);
        }
      }
    }

    return { shouldSquash: false, impacted: false };
  }

  getGridPosition(): { col: number; row: number; worldX: number; worldY: number } {
    return {
      col: this.state.gridCol,
      row: this.state.gridRow,
      worldX: this.state.gridCol * this.config.gridSize + this.config.gridSize / 2,
      worldY: this.state.gridRow * this.config.gridSize + this.config.gridSize / 2,
    };
  }

  snapToGrid(): void {
    const { worldX, worldY } = this.getGridPosition();
    this.sprite.setPosition(worldX, worldY);
    if (this.sprite.body) {
      this.sprite.body.stop();
    }
  }

  destroy(): void {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = undefined;
    }
  }

  private configureBody(): void {
    const { bodyWidth, bodyHeight } = this.config;
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(bodyWidth, bodyHeight, true);
    this.sprite.body.setMaxVelocity(this.config.moveSpeed, this.config.moveSpeed);
    this.sprite.body.setDrag(0, 0);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setDepth(10);
  }

  private startSlide(toCol: number, toRow: number, dirX: number, dirY: number): void {
    this.moving = true;
    this.transitionState(PlayerStateId.Moving);

    const toX = toCol * this.config.gridSize + this.config.gridSize / 2;
    const toY = toRow * this.config.gridSize + this.config.gridSize / 2;

    // Movement duration matches Sokoban style slide feel
    const duration = 200; 

    // Generate speed metrics for event bus integration
    const speed = this.config.gridSize / (duration / 1000);
    this.state.velocityX = dirX * speed;
    this.state.velocityY = dirY * speed;
    this.state.speed = speed;

    this.moveTween = this.scene.tweens.add({
      targets: this.sprite,
      x: toX,
      y: toY,
      duration: duration,
      ease: 'Sine.Out',
      onUpdate: () => {
        EventBus.emitMove({
          x: this.sprite.x,
          y: this.sprite.y,
          vx: this.state.velocityX,
          vy: this.state.velocityY,
          speed: this.state.speed,
        });
      },
      onComplete: () => {
        this.sprite.setPosition(toX, toY);
        if (this.sprite.body) {
          this.sprite.body.reset(toX, toY);
        }
        this.state.gridCol = toCol;
        this.state.gridRow = toRow;
        this.moving = false;
        this.moveTween = undefined;

        this.state.velocityX = 0;
        this.state.velocityY = 0;
        this.state.speed = 0;
        this.transitionState(PlayerStateId.Idle);

        EventBus.emitGridCell({ col: toCol, row: toRow });
        EventBus.emitStop({ x: toX, y: toY });
      },
    });
  }

  private transitionState(next: PlayerStateIdValue): void {
    if (next === this.state.id) {
      return;
    }
    const from = this.state.id;
    this.state.id = next;
    EventBus.emitState({ from, to: next });
  }
}
