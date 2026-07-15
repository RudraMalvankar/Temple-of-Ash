import * as Phaser from 'phaser';
import type { Scene, GameObjects, Physics } from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import { EventBus } from '../core/EventBus';
import { SoundEffects } from '../core/SoundEffects';

type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export type PushableCubeOptions = {
  x: number;
  y: number;
  gridSize?: number;
  /** World cells that cannot be entered (walls). Key: `${col},${row}` */
  blockedCells: Set<string>;
  id?: string;
};

const DEFAULT_GRID = 64;
const MOVE_MS = 160;
const BODY = 40;

let nextId = 1;

/**
 * Sokoban-style push block: one tile per push, no pull, grid locked.
 * Pressure-plate compatible via getGridCell() + EventBus cubeMoved.
 */
export class PushableCube {
  static readonly instances: PushableCube[] = [];

  readonly id: string;
  readonly sprite: ArcadeSprite;
  readonly gridSize: number;

  private readonly scene: Scene;
  private readonly blockedCells: Set<string>;
  private col: number;
  private row: number;
  private moving = false;
  private dust: GameObjects.Particles.ParticleEmitter | undefined;
  private moveTween: Phaser.Tweens.Tween | undefined;

  private constructor(
    scene: Scene,
    sprite: ArcadeSprite,
    options: Required<Pick<PushableCubeOptions, 'blockedCells'>> & {
      gridSize: number;
      id: string;
      col: number;
      row: number;
    }
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.blockedCells = options.blockedCells;
    this.gridSize = options.gridSize;
    this.id = options.id;
    this.col = options.col;
    this.row = options.row;

    sprite.setData('pushableCube', true);
    sprite.setData('cubeId', this.id);
    sprite.setImmovable(true);
    sprite.body.setAllowGravity(false);
    sprite.body.setSize(BODY, BODY, true);
    sprite.body.setDrag(0, 0);
    sprite.setDepth(8);
    sprite.setTint(0xd9c4a0);

    this.createDust();
    PushableCube.instances.push(this);
  }

  static create(scene: Scene, options: PushableCubeOptions): PushableCube {
    const gridSize = options.gridSize ?? DEFAULT_GRID;
    const col = Math.round((options.x - gridSize / 2) / gridSize);
    const row = Math.round((options.y - gridSize / 2) / gridSize);
    const x = col * gridSize + gridSize / 2;
    const y = row * gridSize + gridSize / 2;

    const sprite = scene.physics.add.sprite(x, y, 'prop_decor_03');
    sprite.setDisplaySize(gridSize, gridSize);
    sprite.setOrigin(0.5, 0.5);

    return new PushableCube(scene, sprite, {
      blockedCells: options.blockedCells,
      gridSize,
      id: options.id ?? `cube_${nextId++}`,
      col,
      row,
    });
  }

  static clearRegistry(): void {
    PushableCube.instances.length = 0;
  }

  static occupies(col: number, row: number, except?: PushableCube): boolean {
    return PushableCube.instances.some(
      (cube) => cube !== except && !cube.moving && cube.col === col && cube.row === row
    );
  }

  isMoving(): boolean {
    return this.moving;
  }

  /** Current tile — pressure plates should query this. */
  getGridCell(): { col: number; row: number; x: number; y: number } {
    return {
      col: this.col,
      row: this.row,
      x: this.col * this.gridSize + this.gridSize / 2,
      y: this.row * this.gridSize + this.gridSize / 2,
    };
  }

  /**
   * Attempt a one-tile push. dir must be cardinal (-1/0/1).
   * Returns true if the slide started.
   */
  tryPush(dirX: number, dirY: number): boolean {
    if (this.moving) {
      return false;
    }

    const nx = Math.sign(dirX);
    const ny = Math.sign(dirY);
    // Cardinal only — no diagonal shove.
    if (Math.abs(nx) + Math.abs(ny) !== 1) {
      return false;
    }

    const toCol = this.col + nx;
    const toRow = this.row + ny;
    if (!this.canEnter(toCol, toRow)) {
      return false;
    }

    this.startSlide(toCol, toRow, nx, ny);
    return true;
  }

  /**
   * Called from player↔cube collide: push only when the player is driving into the cube.
   */
  handlePlayerCollide(playerBody: Physics.Arcade.Body): void {
    if (this.moving) {
      return;
    }

    const vx = playerBody.velocity.x;
    const vy = playerBody.velocity.y;
    const speed = Math.hypot(vx, vy);
    if (speed < 40) {
      return;
    }

    const dx = this.sprite.x - playerBody.center.x;
    const dy = this.sprite.y - playerBody.center.y;

    // Choose dominant axis of separation so push direction matches contact.
    let dirX = 0;
    let dirY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      dirX = Math.sign(dx);
      // Player must be moving into the cube along that axis (push, not pull).
      if (dirX !== 0 && Math.sign(vx) !== dirX) {
        return;
      }
    } else {
      dirY = Math.sign(dy);
      if (dirY !== 0 && Math.sign(vy) !== dirY) {
        return;
      }
    }

    this.tryPush(dirX, dirY);
  }

  burn(): void {
    this.moving = true;
    if (this.sprite.body) {
      this.sprite.body.enable = false;
    }
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  destroy(): void {
    this.moveTween?.stop();
    this.dust?.destroy();
    const idx = PushableCube.instances.indexOf(this);
    if (idx >= 0) {
      PushableCube.instances.splice(idx, 1);
    }
    this.sprite.destroy();
  }

  private canEnter(col: number, row: number): boolean {
    if (this.blockedCells.has(`${col},${row}`)) {
      return false;
    }
    if (PushableCube.occupies(col, row, this)) {
      return false;
    }
    return true;
  }

  private startSlide(toCol: number, toRow: number, dirX: number, dirY: number): void {
    const fromCol = this.col;
    const fromRow = this.row;
    const toX = toCol * this.gridSize + this.gridSize / 2;
    const toY = toRow * this.gridSize + this.gridSize / 2;

    this.moving = true;
    this.sprite.body.enable = false;

    this.burstDust(dirX, dirY);
    SoundEffects.playPush(this.scene);

    this.moveTween = this.scene.tweens.add({
      targets: this.sprite,
      x: toX,
      y: toY,
      duration: MOVE_MS,
      ease: 'Sine.Out',
      onComplete: () => {
        this.col = toCol;
        this.row = toRow;
        this.sprite.setPosition(toX, toY);
        this.sprite.body.enable = true;
        this.sprite.body.reset(toX, toY);
        this.moving = false;
        this.moveTween = undefined;
        this.burstDust(dirX, dirY);

        EventBus.emitCubeMoved({
          cubeId: this.id,
          fromCol,
          fromRow,
          toCol,
          toRow,
          x: toX,
          y: toY,
        });
      },
    });
  }

  private createDust(): void {
    const sheet = AssetManager.getSheet('particles');
    if (!sheet || !this.scene.textures.exists(sheet.textureKey)) {
      return;
    }
    const texture = this.scene.textures.get(sheet.textureKey);
    const frame = texture.has('particles_12') ? 'particles_12' : undefined;
    const config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      lifespan: 380,
      speed: { min: 20, max: 70 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      quantity: 0,
      frequency: -1,
      emitting: false,
    };
    if (frame) {
      config.frame = frame;
    }
    this.dust = this.scene.add.particles(0, 0, sheet.textureKey, config);
    this.dust.setDepth(7);
  }

  private burstDust(dirX: number, dirY: number): void {
    if (!this.dust) {
      return;
    }
    this.dust.setPosition(this.sprite.x - dirX * 10, this.sprite.y - dirY * 10 + 12);
    this.dust.explode(8);
  }
}


