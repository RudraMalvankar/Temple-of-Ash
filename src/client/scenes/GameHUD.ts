import { Scene, GameObjects } from 'phaser';
import { LEVELS } from '../levels/levelDefinitions';
import { ProgressionManager } from '../core/ProgressionManager';
import { EventBus } from '../core/EventBus';

const WHITE = '#f2f5fa';
const MUTED = '#9ca3af';

export class GameHUD extends Scene {
  private deathsText!: GameObjects.Text;
  private hintText!: GameObjects.Text;
  private currentLevelIndex: number = 0;
  private unsubscribeDeath: (() => void) | null = null;

  constructor() {
    super('GameHUD');
  }

  create(data: { levelIndex: number }): void {
    this.currentLevelIndex = data.levelIndex;
    
    const { width, height } = this.scale;

    // Level name (top-left)
    const levelName = LEVELS[this.currentLevelIndex]?.name || 'Unknown';
    this.add.text(20, 20, `Level ${this.currentLevelIndex + 1}: ${levelName}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: WHITE,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    // Deaths count (top-right)
    const deaths = ProgressionManager.getDeaths();
    this.deathsText = this.add.text(width - 20, 20, `Deaths: ${deaths}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: MUTED,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);

    // Controls hint (bottom center, fades after 5s)
    this.hintText = this.add.text(width / 2, height - 30, 'R = Restart | ESC = Menu', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: MUTED,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Fade out hint after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: this.hintText,
        alpha: 0,
        duration: 1000,
      });
    });

    // Listen for death events to update counter
    this.unsubscribeDeath = EventBus.onPlayerDied(() => {
      // Death is tracked in ProgressionManager, so we can refresh the display
      const currentDeaths = ProgressionManager.getDeaths();
      this.deathsText.setText(`Deaths: ${currentDeaths}`);
    });

    // Re-layout on resize
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize = (): void => {
    const { width, height } = this.scale;
    
    // Update positions
    this.deathsText.setPosition(width - 20, 20);
    this.hintText.setPosition(width / 2, height - 30);
  };

  shutdown(): void {
    if (this.unsubscribeDeath) {
      this.unsubscribeDeath();
      this.unsubscribeDeath = null;
    }
    this.scale.off('resize', this.handleResize, this);
  }
}