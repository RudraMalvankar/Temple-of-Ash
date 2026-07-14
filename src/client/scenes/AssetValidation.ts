import * as Phaser from 'phaser';
import { Scene, GameObjects } from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import {
  printPipelineReport,
  validateAssetPipeline,
  isRequiredAsset,
  type PipelineValidationReport,
} from '../assets/validateAssetPipeline';

type GalleryCard = {
  key: string;
  category: string;
  root: GameObjects.Container;
  sprite: GameObjects.Sprite | GameObjects.Rectangle;
  isAnim: boolean;
};

const CARD_WIDTH = 200;
const CARD_HEIGHT = 160;
const COLS = 4;
const GAP_X = 16;
const GAP_Y = 24;
const PAD_X = 24;
const CATEGORY_GAP = 32;
const HUD_HEIGHT = 120;

const RED = '#ff4d4d';
const GREEN = '#5dffa0';
const ORANGE = '#ffb347';
const WHITE = '#f2f5fa';

/**
 * Scrollable gallery verifying the new static sprite and animation sequence pipeline.
 * Separates required vs. optional assets gracefully for the hackathon.
 */
export class AssetValidation extends Scene {
  private gallery!: GameObjects.Container;
  private cards: GalleryCard[] = [];
  private scrollY = 0;
  private maxScroll = 0;
  private contentHeight = 0;
  private report!: PipelineValidationReport;
  private hudBg!: GameObjects.Rectangle;
  private actionText!: GameObjects.Text;
  private passed = false;
  private dragStartY = 0;
  private dragScrollStart = 0;
  private isDragging = false;

  constructor() {
    super('AssetValidation');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x12161c);
    this.report = validateAssetPipeline(this);
    printPipelineReport(this.report);
    this.passed = this.report.passed;

    this.gallery = this.add.container(0, 0);
    this.buildGallery();
    this.buildHud();
    this.setupScrolling();
    this.layout();

    this.scale.on('resize', () => this.layout());
  }

  private buildGallery(): void {
    // Group assets by category
    const categories: Record<string, Array<{ key: string; frame: string; isAnim: boolean; categoryName: string }>> = {};

    for (const asset of AssetManager.getStaticAssets()) {
      if (!categories[asset.category]) {
        categories[asset.category] = [];
      }
      categories[asset.category]?.push({ key: asset.key, frame: asset.key, isAnim: false, categoryName: asset.category });
    }

    for (const anim of AssetManager.getAnimAssets()) {
      if (!categories[anim.category]) {
        categories[anim.category] = [];
      }
      const firstFrameNum = anim.customFrames ? anim.customFrames[0] : 1;
      const firstFrame = `${anim.prefix}${String(firstFrameNum).padStart(2, '0')}`;
      categories[anim.category]?.push({ key: anim.key, frame: firstFrame, isAnim: true, categoryName: anim.category });
    }

    let y = HUD_HEIGHT + 24;

    for (const [catName, items] of Object.entries(categories)) {
      const header = this.add
        .text(PAD_X, y, catName, {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: ORANGE,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);
      this.gallery.add(header);
      y += 24;

      let col = 0;
      for (const item of items) {
        if (col >= COLS) {
          col = 0;
          y += CARD_HEIGHT + GAP_Y;
        }

        const x = PAD_X + col * (CARD_WIDTH + GAP_X);
        const card = this.createCard(item.key, item.frame, item.isAnim, item.categoryName, x, y);
        this.gallery.add(card);
        col += 1;
      }
      y += CARD_HEIGHT + CATEGORY_GAP;
    }

    this.contentHeight = y + 40;
  }

  private createCard(key: string, frame: string, isAnim: boolean, category: string, x: number, y: number): GameObjects.Container {
    const hasTexture = this.textures.exists(frame);
    const required = isRequiredAsset(key, category);

    let status: 'loaded' | 'skipped' | 'missing' = 'loaded';
    if (!hasTexture) {
      status = required ? 'missing' : 'skipped';
    }

    const strokeColor = status === 'missing' ? 0xff4d4d : status === 'skipped' ? 0xffb347 : 0x3a4553;
    const labelColor = status === 'missing' ? RED : status === 'skipped' ? ORANGE : WHITE;

    const root = this.add.container(x, y);
    root.add(
      this.add
        .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x1c232d)
        .setOrigin(0)
        .setStrokeStyle(2, strokeColor)
    );

    let sprite: GameObjects.Sprite | GameObjects.Rectangle;
    if (status === 'loaded') {
      const preview = this.add.sprite(CARD_WIDTH / 2, 54, frame);
      const scale = Math.min(
        (CARD_WIDTH - 20) / Math.max(preview.width, 1),
        70 / Math.max(preview.height, 1),
        1
      );
      preview.setScale(scale);
      if (isAnim && this.anims.exists(key)) {
        preview.play(key);
      }
      sprite = preview;
    } else {
      sprite = this.add
        .rectangle(CARD_WIDTH / 2, 54, CARD_WIDTH - 20, 70, status === 'missing' ? 0x3a1010 : 0x2b2210)
        .setStrokeStyle(2, status === 'missing' ? 0xff4d4d : 0xffb347);
      
      const labelText = status === 'missing' ? 'REQUIRED\nMISSING' : 'OPTIONAL\nSKIPPED';
      root.add(
        this.add
          .text(CARD_WIDTH / 2, 54, labelText, {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: labelColor,
            align: 'center',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );
    }
    root.add(sprite);

    // Label name
    root.add(
      this.add
        .text(CARD_WIDTH / 2, 104, this.truncate(key, 24), {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: labelColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0)
    );

    // Status description
    const statusText = status === 'loaded' ? '✓ Loaded' : status === 'skipped' ? '⚠ Optional (Skipped)' : '✗ Required Missing';
    root.add(
      this.add
        .text(12, 122, `type: ${isAnim ? 'anim' : 'static'}\n${statusText}`, {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: labelColor,
          lineSpacing: 1,
        })
        .setOrigin(0, 0)
    );

    this.cards.push({
      key,
      category,
      root,
      sprite,
      isAnim,
    });

    return root;
  }

  private buildHud(): void {
    this.hudBg = this.add
      .rectangle(0, 0, this.scale.width, HUD_HEIGHT, 0x0b0e12, 0.96)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1000);

    this.add
      .text(16, 10, 'GRACEFUL ASSET CHECKLIST', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: WHITE,
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.add
      .text(
        16,
        36,
        this.passed ? '✓ PLAYABLE BUILD VERIFIED — assets loaded gracefully' : '✗ VERIFICATION FAILED — required assets missing',
        {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: this.passed ? GREEN : RED,
          fontStyle: 'bold',
        }
      )
      .setScrollFactor(0)
      .setDepth(1001);

    const lines = [
      {
        label: `✓ Loaded Textures: ${this.report.assetsLoadedCount}`,
        color: GREEN,
      },
      {
        label: `⚠ Skipped Optional: ${this.report.missingOptionalAssets.length}`,
        color: ORANGE,
      },
      {
        label: `✗ Missing Required: ${this.report.missingRequiredAssets.length}`,
        color: this.report.missingRequiredAssets.length === 0 ? GREEN : RED,
      },
    ];

    for (const [index, line] of lines.entries()) {
      this.add
        .text(16 + index * 200, 60, line.label, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: line.color,
        })
        .setScrollFactor(0)
        .setDepth(1001);
    }

    this.actionText = this.add
      .text(
        0,
        0,
        this.passed ? 'Continue → Start Playtest' : 'Blocked (Missing required assets)',
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: this.passed ? GREEN : RED,
          backgroundColor: this.passed ? '#1a3324' : '#331a1a',
          padding: { x: 12, y: 8 },
        }
      )
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(1, 0);

    if (this.passed) {
      this.actionText.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.scene.start('PushTestScene');
      });
    }
  }

  private setupScrolling(): void {
    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _over: unknown,
        _dx: number,
        dy: number
      ) => {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.6, 0, this.maxScroll);
        this.applyScroll();
      }
    );

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < HUD_HEIGHT) {
        return;
      }
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.dragScrollStart = this.scrollY;
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) {
        return;
      }
      const delta = this.dragStartY - pointer.y;
      this.scrollY = Phaser.Math.Clamp(this.dragScrollStart + delta, 0, this.maxScroll);
      this.applyScroll();
    });
  }

  private applyScroll(): void {
    this.gallery.y = -this.scrollY;
  }

  private layout(): void {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);
    this.hudBg.setSize(width, HUD_HEIGHT);
    this.maxScroll = Math.max(0, this.contentHeight - height + 40);
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
    this.applyScroll();
    this.actionText.setPosition(width - 16, 18);
  }



  private truncate(value: string, max: number): string {
    return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
  }
}
