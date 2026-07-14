import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Minimal boot texture for the Preloader progress UI only.
    // All other assets load through AssetManager in the Preloader scene.
    this.load.image('background', 'assets/backgrounds/bg.png');
  }

  create() {
    this.scene.start('Preloader');
  }
}
