import { Scene, GameObjects } from 'phaser';
import { AssetManager } from '../assets/AssetManager';

const ORANGE = '#ff7700';
const ORANGE_GLOW = '#ffb347';
const WHITE = '#f2f5fa';
const MUTED = '#9ca3af';

export class MainMenu extends Scene {
  private darkOverlay!: GameObjects.Rectangle;
  private titleContainer!: GameObjects.Container;
  private menuObjects: (GameObjects.Graphics | GameObjects.Text | GameObjects.Rectangle)[] = [];
  private modalObjects: (GameObjects.Rectangle | GameObjects.Graphics | GameObjects.Text)[] = [];
  private decorations: GameObjects.GameObject[] = [];
  private playerPreview: GameObjects.Sprite | null = null;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Background Image
    const bg = this.add.image(width / 2, height / 2, 'bg_main');
    bg.setDisplaySize(width, height);

    // 2. Semi-transparent dark overlay (40%)
    this.darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

    // 3. Decorations (Stone Door, Portal, Torch, Pillars)
    this.createDecorations();

    // 4. Title Text & Player Preview
    this.createTitleAndPlayer();

    // 5. Menu Buttons Panel (Placed directly on Scene for absolute input safety)
    this.createMenuButtons();

    // 6. Footer Text
    this.createFooter();

    // 7. Entry Fade In
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Re-layout on screen resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createDecorations(): void {
    const { width, height } = this.scale;

    // Clean up old decorations
    for (const dec of this.decorations) {
      dec.destroy();
    }
    this.decorations = [];

    // Left Side: Broken pillar & Torch
    const pillarLeft = AssetManager.spawnPillar(this, 120, height - 160);
    pillarLeft.setAlpha(0.35).setScale(0.85);
    this.decorations.push(pillarLeft);

    const torchLeft = AssetManager.spawnTorch(this, 120, height - 320);
    torchLeft.setAlpha(0.4).setScale(0.8);
    this.decorations.push(torchLeft);

    // Right Side: Closed door & Crystal
    const doorRight = AssetManager.spawnDoor(this, width - 150, height - 160);
    doorRight.setAlpha(0.35).setScale(0.7);
    this.decorations.push(doorRight);

    const crystalRight = AssetManager.spawnCrystal(this, width - 150, height - 320);
    crystalRight.setAlpha(0.4).setScale(0.8);
    this.decorations.push(crystalRight);
  }

  private createTitleAndPlayer(): void {
    const { width, height } = this.scale;

    this.titleContainer = this.add.container(width / 2, height * 0.24);

    // TEMPLE OF ASH
    const titleText = this.add.text(0, -60, 'TEMPLE\nOF\nASH', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: ORANGE,
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 8,
      lineSpacing: -10,
    }).setOrigin(0.5);

    titleText.setShadow(0, 0, ORANGE_GLOW, 20, true, true);

    const subtitleText = this.add.text(0, 45, 'Restore the Ancient Flame', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: MUTED,
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.titleContainer.add([titleText, subtitleText]);

    // Slow cycling player preview idle animation
    if (this.playerPreview) {
      this.playerPreview.destroy();
    }
    this.playerPreview = AssetManager.spawnPlayer(this, width / 2 - 200, height * 0.22);
    this.playerPreview.setScale(0.8).setAlpha(0.85);
  }

  private createMenuButtons(): void {
    const { width, height } = this.scale;

    // Clean up old menu button objects
    for (const obj of this.menuObjects) {
      obj.destroy();
    }
    this.menuObjects = [];

    const options = [
      { text: '▶ Start Game', action: () => this.startGame() },
      { text: '📖 How To Play', action: () => this.showHowToPlay() },
      { text: '⚙ Settings', action: () => this.showSettings() },
      { text: '🏆 Credits', action: () => this.showCredits() },
    ];

    const startY = height * 0.52;
    const btnX = width / 2;

    options.forEach((opt, idx) => {
      const btnY = startY + idx * 58;

      // Button background stone block graphics
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x1c232d, 0.85);
      btnBg.lineStyle(2, 0x3a4553, 1);
      btnBg.fillRoundedRect(btnX - 120, btnY - 20, 240, 40, 4);
      btnBg.strokeRoundedRect(btnX - 120, btnY - 20, 240, 40, 4);

      const label = this.add.text(btnX, btnY, opt.text, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: WHITE,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Interactive hit area overlay (placed directly on scene for absolute coordinate tracking)
      const hitArea = this.add.rectangle(btnX, btnY, 240, 40, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      // Hover effects
      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: [label],
          scaleX: 1.08,
          scaleY: 1.08,
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

      // Press effects
      hitArea.on('pointerdown', () => {
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

  private createFooter(): void {
    const { width, height } = this.scale;

    this.add.text(20, height - 30, 'Version 1.0', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: MUTED,
    }).setOrigin(0, 0.5);

    this.add.text(width - 20, height - 30, 'Temple of Ash © 2026', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: MUTED,
    }).setOrigin(1, 0.5);
  }

  private startGame(): void {
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PushTestScene');
    });
  }

  private showHowToPlay(): void {
    const content = [
      'MOVE: WASD / Arrow Keys',
      'BLOCKS: Walk into wooden crates to shove them.',
      'MECHANISMS: Activate floor pressure plates to trigger stone doors.',
      'OBJECTIVE: Step into portal gateways to complete the layout.',
      'HAZARDS: Avoid pool lava and laser beams.',
    ];
    this.showModal('HOW TO PLAY', content);
  }

  private showSettings(): void {
    const content = [
      'MUSIC: [ ON ]',
      'SFX:   [ ON ]',
      'FULLSCREEN: [ WINDOWED ]',
      '',
      '(Configured for hackathon playtests)',
    ];
    this.showModal('SETTINGS', content);
  }

  private showCredits(): void {
    const content = [
      'TEMPLE OF ASH',
      'Built for the Reddit Games & Puzzles Hackathon',
      '',
      'Developed by:',
      'Rudra Malvankar',
    ];
    this.showModal('CREDITS', content);
  }

  private showModal(title: string, lines: string[]): void {
    this.closeModal();

    const { width, height } = this.scale;

    // Modal background overlay blocking other buttons
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65)
      .setInteractive()
      .setDepth(2000);
    
    // Stone panel card
    const cardBg = this.add.graphics().setDepth(2001);
    cardBg.fillStyle(0x11161d, 0.95);
    cardBg.lineStyle(3, 0xff7700, 1);
    cardBg.fillRoundedRect(width / 2 - 220, height / 2 - 160, 440, 320, 6);
    cardBg.strokeRoundedRect(width / 2 - 220, height / 2 - 160, 440, 320, 6);

    const titleText = this.add.text(width / 2, height / 2 - 120, title, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: ORANGE,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2002);

    const bodyText = this.add.text(width / 2, height / 2 - 70, lines.join('\n\n'), {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: WHITE,
      align: 'center',
      wordWrap: { width: 380 },
    }).setOrigin(0.5, 0).setDepth(2002);

    // Close button rectangular block
    const closeBtnBg = this.add.graphics().setDepth(2001);
    closeBtnBg.fillStyle(0x1c232d, 1);
    closeBtnBg.lineStyle(1, 0x3a4553, 1);
    closeBtnBg.fillRoundedRect(width / 2 - 50, height / 2 + 100, 100, 32, 4);
    closeBtnBg.strokeRoundedRect(width / 2 - 50, height / 2 + 100, 100, 32, 4);

    const closeBtnLabel = this.add.text(width / 2, height / 2 + 116, 'CLOSE', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: WHITE,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2002);

    const closeHit = this.add.rectangle(width / 2, height / 2 + 116, 100, 32, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(2003);

    closeHit.on('pointerdown', () => this.closeModal());
    backdrop.on('pointerdown', () => this.closeModal());

    // Escape key closes modal
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.once('down', () => this.closeModal());

    this.modalObjects.push(backdrop, cardBg, titleText, bodyText, closeBtnBg, closeBtnLabel, closeHit);
  }

  private closeModal(): void {
    for (const obj of this.modalObjects) {
      obj.destroy();
    }
    this.modalObjects = [];
  }

  private handleResize = (): void => {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);
    this.darkOverlay.setPosition(width / 2, height / 2).setSize(width, height);
    
    this.createDecorations();
    this.createTitleAndPlayer();
    this.createMenuButtons();
    this.closeModal();
  };
}
