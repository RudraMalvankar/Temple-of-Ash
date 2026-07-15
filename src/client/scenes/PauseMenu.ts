import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import { SoundEffects } from '../core/SoundEffects';
import { LevelManager } from '../gameplay/LevelManager';

const WHITE = '#f2f5fa';
const ORANGE = '#ff7700';
const ORANGE_GLOW = '#ffb347';

export class PauseMenu extends Scene {
  private menuObjects: (GameObjects.Graphics | GameObjects.Text | GameObjects.Rectangle)[] = [];

  constructor() {
    super('PauseMenu');
  }

  create(): void {
    const { width, height } = this.scale;

    // Pause the gameplay scenes
    this.scene.pause('PushTestScene');
    this.scene.pause('GameHUD');

    // Semi-transparent dark overlay
    const darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setInteractive();

    // Title
    const titleText = this.add.text(width / 2, height * 0.3, 'PAUSED', {
      fontFamily: 'Georgia, serif',
      fontSize: '36px',
      color: ORANGE,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.menuObjects.push(darkOverlay, titleText);

    // Menu buttons
    this.createMenuButtons();

    // ESC key to resume
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.once('down', () => this.resumeGame());
  }

  private createMenuButtons(): void {
    const { width, height } = this.scale;

    const options = [
      { text: '▶ Resume', action: () => this.resumeGame() },
      { text: '🔄 Restart Level', action: () => this.restartLevel() },
      { text: '🗺 Level Select', action: () => this.goToLevelSelect() },
      { text: '🏠 Main Menu', action: () => this.goToMainMenu() },
    ];

    const startY = height * 0.45;
    const btnX = width / 2;

    options.forEach((opt, idx) => {
      const btnY = startY + idx * 60;

      // Button background
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x1c232d, 0.9);
      btnBg.lineStyle(2, 0x3a4553, 1);
      btnBg.fillRoundedRect(btnX - 140, btnY - 22, 280, 44, 4);
      btnBg.strokeRoundedRect(btnX - 140, btnY - 22, 280, 44, 4);

      const label = this.add.text(btnX, btnY, opt.text, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: WHITE,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(btnX, btnY, 280, 44, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: [label],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
        });
        label.setColor(ORANGE_GLOW);
      });

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: [label],
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 100,
        });
        label.setColor(WHITE);
      });

      hitArea.on('pointerdown', () => {
        SoundEffects.playClick(this);
        this.tweens.add({
          targets: [label],
          scaleX: 0.95,
          scaleY: 0.95,
          yoyo: true,
          duration: 80,
          onComplete: opt.action,
        });
      });

      this.menuObjects.push(btnBg, label, hitArea);
    });
  }

  private resumeGame(): void {
    this.scene.resume('PushTestScene');
    this.scene.resume('GameHUD');
    this.scene.stop();
  }

  private restartLevel(): void {
    // Resume gameplay first, then reset
    this.scene.resume('PushTestScene');
    this.scene.resume('GameHUD');
    this.scene.stop();
    
    // Reset the current level
    LevelManager.resetLevel(false);
  }

  private goToLevelSelect(): void {
    // Stop gameplay scenes
    this.scene.stop('PushTestScene');
    this.scene.stop('GameHUD');
    this.scene.stop();
    
    // Go to level select
    this.scene.start('LevelSelect');
  }

  private goToMainMenu(): void {
    // Stop gameplay scenes
    this.scene.stop('PushTestScene');
    this.scene.stop('GameHUD');
    this.scene.stop();
    
    // Go to main menu
    this.scene.start('MainMenu');
  }
}