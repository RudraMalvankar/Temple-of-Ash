import * as Phaser from 'phaser';
import type { Scene, Input, GameObjects } from 'phaser';
import type { PlayerConfig } from './PlayerConfig';

export type InputVector = {
  x: number;
  y: number;
  /** True when device input exceeds deadzone. */
  active: boolean;
};

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

/**
 * Desktop (WASD / arrows) + mobile virtual joystick.
 * Returns a normalized vector every frame; never talks to physics directly.
 */
export class PlayerInput {
  private readonly cursors: CursorKeys | undefined;
  private readonly wasd:
    | {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
      }
    | undefined;

  private readonly joystickBase: GameObjects.Arc;
  private readonly joystickKnob: GameObjects.Arc;
  private readonly marginLeft: number;
  private readonly marginBottom: number;
  private joystickOriginX: number;
  private joystickOriginY: number;
  private joystickPointerId: number | undefined;
  private stickX = 0;
  private stickY = 0;
  private readonly deadzone: number;
  private readonly radius: number;
  private destroyed = false;

  constructor(
    private readonly scene: Scene,
    config: PlayerConfig['joystick']
  ) {
    this.deadzone = config.deadzone;
    this.radius = config.radius;
    this.marginLeft = config.marginLeft;
    this.marginBottom = config.marginBottom;

    const keyboard = scene.input.keyboard;
    this.cursors = keyboard?.createCursorKeys();
    this.wasd = keyboard
      ? {
          up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        }
      : undefined;
    if (keyboard) {
      keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D
      ]);
    }

    this.joystickOriginX = this.marginLeft;
    this.joystickOriginY = scene.scale.height - this.marginBottom;

    this.joystickBase = scene.add
      .circle(this.joystickOriginX, this.joystickOriginY, config.radius, 0x1a1f28, 0.45)
      .setStrokeStyle(2, 0xff6a1a, 0.55)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);

    this.joystickKnob = scene.add
      .circle(this.joystickOriginX, this.joystickOriginY, config.knobRadius, 0xff8a3a, 0.7)
      .setScrollFactor(0)
      .setDepth(2001)
      .setVisible(false);

    this.bindJoystick();
    scene.scale.on('resize', this.onResize, this);
  }

  getVector(): InputVector {
    let x = 0;
    let y = 0;

    if (this.cursors?.left.isDown || this.wasd?.left.isDown) {
      x -= 1;
    }
    if (this.cursors?.right.isDown || this.wasd?.right.isDown) {
      x += 1;
    }
    if (this.cursors?.up.isDown || this.wasd?.up.isDown) {
      y -= 1;
    }
    if (this.cursors?.down.isDown || this.wasd?.down.isDown) {
      y += 1;
    }

    if (this.joystickPointerId !== undefined) {
      x = this.stickX;
      y = this.stickY;
    }

    const length = Math.hypot(x, y);
    if (length <= this.deadzone) {
      return { x: 0, y: 0, active: false };
    }

    return {
      x: x / length,
      y: y / length,
      active: true,
    };
  }

  setJoystickVisible(visible: boolean): void {
    this.joystickBase.setVisible(visible);
    this.joystickKnob.setVisible(visible);
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.scene.scale.off('resize', this.onResize, this);
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.joystickBase.destroy();
    this.joystickKnob.destroy();
  }

  private bindJoystick(): void {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);

    const touch = this.scene.sys.game.device.input.touch;
    this.setJoystickVisible(touch);
  }

  private onResize = (gameSize: { height: number }): void => {
    this.joystickOriginX = this.marginLeft;
    this.joystickOriginY = gameSize.height - this.marginBottom;
    if (this.joystickPointerId === undefined) {
      this.joystickBase.setPosition(this.joystickOriginX, this.joystickOriginY);
      this.joystickKnob.setPosition(this.joystickOriginX, this.joystickOriginY);
    }
  };

  private onPointerDown = (pointer: Input.Pointer): void => {
    if (pointer.x > this.scene.scale.width * 0.45) {
      return;
    }
    if (this.joystickPointerId !== undefined) {
      return;
    }

    this.joystickPointerId = pointer.id;
    this.setJoystickVisible(true);
    this.joystickBase.setPosition(pointer.x, pointer.y);
    this.joystickKnob.setPosition(pointer.x, pointer.y);
    this.stickX = 0;
    this.stickY = 0;
  };

  private onPointerMove = (pointer: Input.Pointer): void => {
    if (pointer.id !== this.joystickPointerId) {
      return;
    }

    const dx = pointer.x - this.joystickBase.x;
    const dy = pointer.y - this.joystickBase.y;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, this.radius);
    const angle = Math.atan2(dy, dx);
    this.joystickKnob.setPosition(
      this.joystickBase.x + Math.cos(angle) * clamped,
      this.joystickBase.y + Math.sin(angle) * clamped
    );

    if (len <= 0) {
      this.stickX = 0;
      this.stickY = 0;
      return;
    }

    const strength = clamped / this.radius;
    this.stickX = (dx / len) * strength;
    this.stickY = (dy / len) * strength;
  };

  private onPointerUp = (pointer: Input.Pointer): void => {
    if (pointer.id !== this.joystickPointerId) {
      return;
    }
    this.joystickPointerId = undefined;
    this.stickX = 0;
    this.stickY = 0;
    this.joystickKnob.setPosition(this.joystickBase.x, this.joystickBase.y);

    const touch = this.scene.sys.game.device.input.touch;
    if (!touch) {
      this.setJoystickVisible(false);
    }
  };
}
