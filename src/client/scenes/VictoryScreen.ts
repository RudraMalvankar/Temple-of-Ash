import { Scene, GameObjects } from 'phaser';
import { ProgressionManager } from '../core/ProgressionManager';
import { SoundEffects } from '../core/SoundEffects';

const ORANGE = '#ff7700';
const ORANGE_GLOW = '#ffb347';
const WHITE = '#f2f5fa';
const MUTED = '#9ca3af';

export class VictoryScreen extends Scene {
  private darkOverlay!: GameObjects.Rectangle;
  private menuObjects: (GameObjects.Graphics | GameObjects.Text | GameObjects.Rectangle)[] = [];
  private decorations: GameObjects.GameObject[] = [];

  constructor() {
    super('VictoryScreen');
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Background Image
    const bg = this.add.image(width / 2, height / 2, 'bg_main');
    bg.setDisplaySize(width, height);

    // 2. Semi-transparent dark overlay (50%)
    this.darkOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

    // 3. Fire particles celebration
    this.createFireParticles();

    // 4. Title
    this.createTitle();

    // 5. Stats
    this.createStats();

    // 6. Buttons
    this.createButtons();

    // 7. Entry Fade In
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Play victory sound
    SoundEffects.playWin(this);

    // Re-layout on screen resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createFireParticles(): void {
    const { width, height } = this.scale;
    
    // Create ember particles for celebration
    const particles = this.add.particles(width / 2, height * 0.3, 'particle_ember', {
      speed: { min: 20, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.6, end: 0 },
      lifespan: 3000,
      frequency: 50,
      quantity: 2,
      alpha: { start: 0.9, end: 0 },
      tint: [0xff7700, 0xffaa00, 0xff5500],
    });
    
    this.decorations.push(particles);
  }

  private createTitle(): void {
    const { width, height } = this.scale;

    const titleText = this.add.text(width / 2, height * 0.2, 'TEMPLE\nRESTORED', {
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

    const subtitleText = this.add.text(width / 2, height * 0.35, 'The Ancient Flame reignited', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: MUTED,
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.menuObjects.push(titleText, subtitleText);
  }

  private createStats(): void {
    const { width, height } = this.scale;

    const deaths = ProgressionManager.getDeaths();
    const completedLevels = ProgressionManager.getCompletedLevels().length;

    const statsText = this.add.text(width / 2, height * 0.5, `Levels Completed: ${completedLevels}/8\nTotal Deaths: ${deaths}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: WHITE,
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    this.menuObjects.push(statsText);
  }

  private createButtons(): void {
    const { width, height } = this.scale;

    const options = [
      { text: '▶ Play Again', action: () => this.playAgain() },
      { text: '🏠 Main Menu', action: () => this.goToMainMenu() },
    ];

    const startY = height * 0.65;
    const btnX = width / 2;

    options.forEach((opt, idx) => {
      const btnY = startY + idx * 60;

      // Button background
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

      const hitArea = this.add.rectangle(btnX, btnY, 240, 40, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

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

  private playAgain(): void {
    ProgressionManager.reset();
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PushTestScene');
    });
  }

  private goToMainMenu(): void {
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }

  private handleResize = (): void => {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);
    this.darkOverlay.setPosition(width / 2, height / 2).setSize(width, height);
    
    // Recreate UI elements
    for (const obj of this.menuObjects) {
      obj.destroy();
    }
    this.menuObjects = [];
    
    for (const dec of this.decorations) {
      dec.destroy();
    }
    this.decorations = [];
    
    this.createFireParticles();
    this.createTitle();
    this.createStats();
    this.createButtons();
  };
}