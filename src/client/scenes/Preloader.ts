import { Scene } from 'phaser';
import { AssetManager } from '../assets/AssetManager';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    this.add.image(512, 384, 'background');

    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    this.load.on('progress', (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    AssetManager.loadAssets(this);
  }

  create() {
    AssetManager.createAnimations(this);
    this.scene.start('AssetValidation');
  }
}
