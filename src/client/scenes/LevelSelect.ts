import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import { LEVELS } from '../levels/levelDefinitions';
import { ProgressionManager } from '../core/ProgressionManager';
import { PushTestScene } from './PushTestScene';
import { SoundEffects } from '../core/SoundEffects';

const ORANGE = '#ff7700';
const ORANGE_GLOW = '#ffb347';
const WHITE = '#f2f5fa';
const MUTED = '#9ca3af';
const LOCKED_COLOR = '#4a5568';

export class LevelSelect extends Scene {
  private darkOverlay!: GameObjects.Rectangle;
  private menuObjects: (GameObjects.Graphics | GameObjects.Text | GameObjects.Rectangle)[] = [];

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Background Image
    const bg = this.add.image(width / 2, height / 2, 'bg_main');
    bg.setDisplaySize(width, height);

    // 2. Semi-transparent dark overlay (40%)
    this.darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

    // 3. Title
    this.add.text(width / 2, height * 0.15, 'SELECT LEVEL', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: ORANGE,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // 4. Level Grid
    this.createLevelGrid();

    // 5. Back Button
    this.createBackButton();

    // 6. Entry Fade In
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // ESC key to go back
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.once('down', () => this.goBack());

    // Re-layout on screen resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createLevelGrid(): void {
    const { width, height } = this.scale;

    // Clean up old objects
    for (const obj of this.menuObjects) {
      obj.destroy();
    }
    this.menuObjects = [];

    const maxUnlocked = ProgressionManager.getMaxUnlocked();
    const completedLevels = ProgressionManager.getCompletedLevels();

    const gridCols = 4;
    const btnWidth = 180;
    const btnHeight = 80;
    const gapX = 20;
    const gapY = 20;

    const totalWidth = gridCols * btnWidth + (gridCols - 1) * gapX;

    const startX = (width - totalWidth) / 2 + btnWidth / 2;
    const startY = height * 0.3;

    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      if (!level) continue;
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      const btnX = startX + col * (btnWidth + gapX);
      const btnY = startY + row * (btnHeight + gapY);

      const isUnlocked = i < maxUnlocked;
      const isCompleted = completedLevels.includes(i + 1);

      // Button background
      const btnBg = this.add.graphics();
      if (isUnlocked) {
        btnBg.fillStyle(0x1c232d, 0.85);
        btnBg.lineStyle(2, 0x3a4553, 1);
      } else {
        btnBg.fillStyle(0x0f1218, 0.7);
        btnBg.lineStyle(2, 0x2a3040, 1);
      }
      btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 6);
      btnBg.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 6);

      // Level number
      const levelNum = this.add.text(btnX, btnY - 20, `${i + 1}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: isUnlocked ? WHITE : LOCKED_COLOR,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Level name
      const levelName = this.add.text(btnX, btnY + 10, level.name, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: isUnlocked ? MUTED : LOCKED_COLOR,
      }).setOrigin(0.5);

      // Status icon
      let statusIcon = '';
      if (isCompleted) {
        statusIcon = '✓';
      } else if (!isUnlocked) {
        statusIcon = '🔒';
      }

      const statusText = this.add.text(btnX + btnWidth / 2 - 15, btnY - btnHeight / 2 + 10, statusIcon, {
        fontSize: '14px',
      }).setOrigin(0.5);

      // Interactive hit area
      const hitArea = this.add.rectangle(btnX, btnY, btnWidth, btnHeight, 0xffffff, 0)
        .setInteractive({ useHandCursor: isUnlocked });

      if (isUnlocked) {
        hitArea.on('pointerover', () => {
          this.tweens.add({
            targets: [levelNum, levelName],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
          });
          levelNum.setColor(ORANGE_GLOW);
        });

        hitArea.on('pointerout', () => {
          this.tweens.add({
            targets: [levelNum, levelName],
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100,
          });
          levelNum.setColor(WHITE);
        });

        hitArea.on('pointerdown', () => {
          SoundEffects.playClick(this);
          this.tweens.add({
            targets: [levelNum, levelName],
            scaleX: 0.95,
            scaleY: 0.95,
            yoyo: true,
            duration: 80,
            onComplete: () => this.selectLevel(i),
          });
        });
      }

      this.menuObjects.push(btnBg, levelNum, levelName, statusText, hitArea);
    }
  }

  private createBackButton(): void {
    const { width, height } = this.scale;

    const btnX = width / 2;
    const btnY = height * 0.85;

    // Button background
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1c232d, 0.85);
    btnBg.lineStyle(2, 0x3a4553, 1);
    btnBg.fillRoundedRect(btnX - 100, btnY - 20, 200, 40, 4);
    btnBg.strokeRoundedRect(btnX - 100, btnY - 20, 200, 40, 4);

    const label = this.add.text(btnX, btnY, '← BACK TO MENU', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: WHITE,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(btnX, btnY, 200, 40, 0xffffff, 0)
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
      this.goBack();
    });

    this.menuObjects.push(btnBg, label, hitArea);
  }

  private selectLevel(levelIndex: number): void {
    PushTestScene.levelIndex = levelIndex;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PushTestScene');
    });
  }

  private goBack(): void {
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }

  private handleResize = (): void => {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);
    this.darkOverlay.setPosition(width / 2, height / 2).setSize(width, height);
    
    this.createLevelGrid();
    this.createBackButton();
  };
}