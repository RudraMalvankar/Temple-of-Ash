import type { Scene, Physics } from 'phaser';
import * as Phaser from 'phaser';
import { EventBus } from '../core/EventBus';
import type { PlayerConfig } from './PlayerConfig';
import type { InputVector } from './PlayerInput';
import {
  PlayerStateId,
  createInitialPlayerState,
  resolveMovementState,
  type PlayerRuntimeState,
  type PlayerStateIdValue,
} from './PlayerState';

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

/**
 * Applies smoothed velocity, tracks grid cells, detects wall impacts.
 */
export class PlayerController {
  readonly state: PlayerRuntimeState;
  private previousSpeed = 0;
  private wasMoving = false;

  constructor(
    private readonly scene: Scene,
    private readonly sprite: ArcadeSprite,
    private readonly config: PlayerConfig
  ) {
    this.state = createInitialPlayerState(sprite.x, sprite.y, config.gridSize);
    this.configureBody();
  }

  /**
   * @returns true when a stop-squash should play (transition into idle).
   */
  update(deltaMs: number, input: InputVector): { shouldSquash: boolean; impacted: boolean } {
    const dt = deltaMs / 1000;
    this.applyMovement(dt, input);

    const body = this.sprite.body;
    let impacted = false;
    if (body) {
      impacted = this.detectImpact(body);
      this.state.velocityX = body.velocity.x;
      this.state.velocityY = body.velocity.y;
      this.state.speed = Math.hypot(body.velocity.x, body.velocity.y);
      this.state.wasBlockedX = body.blocked.left || body.blocked.right;
      this.state.wasBlockedY = body.blocked.up || body.blocked.down;
    }

    this.state.inputX = input.x;
    this.state.inputY = input.y;

    const nextState = resolveMovementState(
      this.state.speed,
      input.active,
      this.config.rollSpeedThreshold
    );
    this.transitionState(nextState);
    this.updateGridCell();

    const shouldSquash = this.wasMoving && nextState === PlayerStateId.Idle;
    this.wasMoving = nextState === PlayerStateId.Moving || nextState === PlayerStateId.Rolling;
    this.previousSpeed = this.state.speed;

    if (this.state.speed > 1) {
      EventBus.emitMove({
        x: this.sprite.x,
        y: this.sprite.y,
        vx: this.state.velocityX,
        vy: this.state.velocityY,
        speed: this.state.speed,
      });
    } else if (shouldSquash) {
      EventBus.emitStop({ x: this.sprite.x, y: this.sprite.y });
    }

    return { shouldSquash, impacted };
  }

  getGridPosition(): { col: number; row: number; worldX: number; worldY: number } {
    return {
      col: this.state.gridCol,
      row: this.state.gridRow,
      worldX: this.state.gridCol * this.config.gridSize + this.config.gridSize / 2,
      worldY: this.state.gridRow * this.config.gridSize + this.config.gridSize / 2,
    };
  }

  /** Future puzzles: snap the body to the center of the current grid cell. */
  snapToGrid(): void {
    const { worldX, worldY } = this.getGridPosition();
    this.sprite.setPosition(worldX, worldY);
    this.sprite.body.stop();
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

  private applyMovement(dt: number, input: InputVector): void {
    const body = this.sprite.body;
    const targetX = input.active ? input.x * this.config.moveSpeed : 0;
    const targetY = input.active ? input.y * this.config.moveSpeed : 0;
    const rate = input.active ? this.config.acceleration : this.config.deceleration;

    let vx = this.approach(body.velocity.x, targetX, rate * dt);
    let vy = this.approach(body.velocity.y, targetY, rate * dt);

    if (this.config.normalizeDiagonal && input.active && input.x !== 0 && input.y !== 0) {
      const speed = Math.hypot(vx, vy);
      if (speed > this.config.moveSpeed) {
        const scale = this.config.moveSpeed / speed;
        vx *= scale;
        vy *= scale;
      }
    }

    body.setVelocity(vx, vy);
  }

  private approach(current: number, target: number, maxDelta: number): number {
    if (current < target) {
      return Math.min(current + maxDelta, target);
    }
    if (current > target) {
      return Math.max(current - maxDelta, target);
    }
    return target;
  }

  private detectImpact(body: Physics.Arcade.Body): boolean {
    const blockedNowX = body.blocked.left || body.blocked.right;
    const blockedNowY = body.blocked.up || body.blocked.down;
    const hitX = blockedNowX && !this.state.wasBlockedX;
    const hitY = blockedNowY && !this.state.wasBlockedY;

    if (!(hitX || hitY)) {
      return false;
    }
    if (this.previousSpeed < this.config.impactSpeedThreshold) {
      return false;
    }

    const normalX = body.blocked.left ? 1 : body.blocked.right ? -1 : 0;
    const normalY = body.blocked.up ? 1 : body.blocked.down ? -1 : 0;

    EventBus.emitImpact({
      speed: this.previousSpeed,
      normalX,
      normalY,
    });

    this.scene.cameras.main.shake(
      this.config.impactShake.duration,
      this.config.impactShake.intensity
    );

    return true;
  }

  private transitionState(next: PlayerStateIdValue): void {
    if (next === this.state.id) {
      return;
    }
    const from = this.state.id;
    this.state.id = next;
    EventBus.emitState({ from, to: next });
  }

  private updateGridCell(): void {
    const col = Math.floor(this.sprite.x / this.config.gridSize);
    const row = Math.floor(this.sprite.y / this.config.gridSize);
    if (col === this.state.gridCol && row === this.state.gridRow) {
      return;
    }
    this.state.gridCol = col;
    this.state.gridRow = row;
    EventBus.emitGridCell({ col, row });
  }
}
