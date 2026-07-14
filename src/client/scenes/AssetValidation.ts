import * as Phaser from 'phaser';
import { Scene, GameObjects } from 'phaser';
import { AssetManager } from '../assets/AssetManager';
import type { AssetSheetDef } from '../assets/types';
import {
  printPipelineReport,
  validateAssetPipeline,
  type PipelineValidationReport,
} from '../assets/validateAssetPipeline';

type GalleryCard = {
  sheet: AssetSheetDef;
  root: GameObjects.Container;
  sprite: GameObjects.Sprite | GameObjects.Rectangle;
  animIndex: number;
  animTimer: number;
  hasTexture: boolean;
  missingAnims: string[];
};

const CARD_WIDTH = 220;
const CARD_HEIGHT = 280;
const COLS = 4;
const GAP_X = 16;
const GAP_Y = 28;
const PAD_X = 24;
const CATEGORY_GAP = 48;
const HUD_HEIGHT = 110;

const RED = '#ff4d4d';
const GREEN = '#5dffa0';
const MUTED = '#b8c0cc';
const WHITE = '#f2f5fa';

/**
 * Scrollable gallery that verifies every AssetManager sheet/animation
 * before gameplay scenes are allowed to run.
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

  override update(_time: number, delta: number): void {
    for (const card of this.cards) {
      if (!card.hasTexture || card.sheet.animations.length < 2) {
        continue;
      }
      if (!('play' in card.sprite)) {
        continue;
      }

      card.animTimer += delta;
      if (card.animTimer < 1800) {
        continue;
      }

      card.animTimer = 0;
      card.animIndex = (card.animIndex + 1) % card.sheet.animations.length;
      const anim = card.sheet.animations[card.animIndex];
      if (!anim || !this.anims.exists(anim.name)) {
        continue;
      }
      card.sprite.play(anim.name);
    }
  }

  private buildGallery(): void {
    const sheets = [...AssetManager.getSheets()].sort((a, b) => {
      const cat = a.category.localeCompare(b.category);
      return cat !== 0 ? cat : a.name.localeCompare(b.name);
    });

    let previousCategory = '';
    let col = 0;
    let y = HUD_HEIGHT + 24;

    for (const sheet of sheets) {
      if (sheet.category !== previousCategory) {
        if (previousCategory !== '') {
          y += CARD_HEIGHT + CATEGORY_GAP;
          col = 0;
        }

        const header = this.add
          .text(PAD_X, y, sheet.category.toUpperCase(), {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffb347',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0);
        this.gallery.add(header);
        y += 28;
        previousCategory = sheet.category;
      }

      if (col >= COLS) {
        col = 0;
        y += CARD_HEIGHT + GAP_Y;
      }

      const x = PAD_X + col * (CARD_WIDTH + GAP_X);
      this.gallery.add(this.createCard(sheet, x, y));
      col += 1;
    }

    this.contentHeight = y + CARD_HEIGHT + 80;
  }

  private createCard(sheet: AssetSheetDef, x: number, y: number): GameObjects.Container {
    const hasTexture = this.textures.exists(sheet.textureKey);
    const missingAnims = sheet.animations
      .filter((anim) => !this.anims.exists(anim.name))
      .map((anim) => anim.name);
    const frameInvalid = this.report.invalidFrameSizes.some((item) =>
      item.startsWith(`${sheet.name}:`)
    );
    const hasError = !hasTexture || missingAnims.length > 0 || frameInvalid;

    const root = this.add.container(x, y);
    root.add(
      this.add
        .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x1c232d)
        .setOrigin(0)
        .setStrokeStyle(2, hasError ? 0xff4d4d : 0x3a4553)
    );

    let sprite: GameObjects.Sprite | GameObjects.Rectangle;
    if (hasTexture) {
      const preview = this.add.sprite(CARD_WIDTH / 2, 78, sheet.textureKey);
      const scale = Math.min(
        (CARD_WIDTH - 24) / Math.max(preview.width, 1),
        110 / Math.max(preview.height, 1),
        1
      );
      preview.setScale(scale);

      const firstAnim = sheet.animations[0];
      if (firstAnim && this.anims.exists(firstAnim.name)) {
        preview.play(firstAnim.name);
      } else if (sheet.loadMode === 'grid') {
        const frameKey = `${sheet.name}_0`;
        if (this.textures.get(sheet.textureKey).has(frameKey)) {
          preview.setFrame(frameKey);
        }
      }
      sprite = preview;
    } else {
      sprite = this.add
        .rectangle(CARD_WIDTH / 2, 78, CARD_WIDTH - 24, 110, 0x3a1010)
        .setStrokeStyle(2, 0xff4d4d);
      root.add(
        this.add
          .text(CARD_WIDTH / 2, 78, 'MISSING\nTEXTURE', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: RED,
            align: 'center',
          })
          .setOrigin(0.5)
      );
    }
    root.add(sprite);

    const texSize = hasTexture ? this.getTextureSizeLabel(sheet.textureKey) : 'n/a';
    const fpsLabels =
      sheet.animations.length > 0
        ? sheet.animations.map((anim) => String(anim.fps)).join(', ')
        : '—';
    const animNames =
      sheet.animations.length > 0 ? sheet.animations.map((anim) => anim.name).join(', ') : '(none)';

    root.add(
      this.add
        .text(CARD_WIDTH / 2, 145, sheet.name, {
          fontFamily: 'Arial',
          fontSize: '15px',
          color: hasError ? RED : WHITE,
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0)
    );

    root.add(
      this.add
        .text(
          10,
          168,
          [`frames: ${sheet.frames}`, `fps: ${fpsLabels}`, `tex: ${texSize}`, 'anims:'].join('\n'),
          {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: MUTED,
            lineSpacing: 2,
          }
        )
        .setOrigin(0, 0)
    );

    root.add(
      this.add
        .text(10, 228, this.truncate(animNames, 44), {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: missingAnims.length > 0 ? RED : MUTED,
          wordWrap: { width: CARD_WIDTH - 20 },
        })
        .setOrigin(0, 0)
    );

    if (missingAnims.length > 0) {
      root.add(
        this.add
          .text(10, 258, `missing: ${missingAnims.join(', ')}`, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: RED,
            wordWrap: { width: CARD_WIDTH - 20 },
          })
          .setOrigin(0, 0)
      );
    } else if (frameInvalid) {
      root.add(
        this.add
          .text(10, 258, 'invalid frame size', {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: RED,
          })
          .setOrigin(0, 0)
      );
    }

    this.cards.push({
      sheet,
      root,
      sprite,
      animIndex: 0,
      animTimer: 0,
      hasTexture,
      missingAnims,
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
      .text(16, 10, 'ASSET VALIDATION', {
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
        this.passed ? 'VALIDATION PASSED' : 'VALIDATION FAILED — fix issues before gameplay',
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: this.passed ? GREEN : RED,
          fontStyle: 'bold',
        }
      )
      .setScrollFactor(0)
      .setDepth(1001);

    const lines = [
      {
        label: `✓ Assets Loaded (${this.report.assetsLoaded.length})`,
        ok: this.report.missingAssets.length === 0 && this.report.assetsLoaded.length > 0,
      },
      {
        label: `✓ Animations Loaded (${this.report.animationsLoaded.length})`,
        ok: this.report.missingAnimations.length === 0,
      },
      {
        label: `✓ Missing Assets (${this.report.missingAssets.length})`,
        ok: this.report.missingAssets.length === 0,
      },
      {
        label: `✓ Missing Animations (${this.report.missingAnimations.length})`,
        ok: this.report.missingAnimations.length === 0,
      },
      {
        label: `✓ Invalid Frame Sizes (${this.report.invalidFrameSizes.length})`,
        ok: this.report.invalidFrameSizes.length === 0,
      },
    ];

    for (const [index, line] of lines.entries()) {
      this.add
        .text(16 + (index < 3 ? 0 : 260), 58 + (index % 3) * 16, line.label, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: line.ok ? GREEN : RED,
        })
        .setScrollFactor(0)
        .setDepth(1001);
    }

    this.actionText = this.add
      .text(
        0,
        0,
        this.passed ? 'Continue → Main Menu' : 'Blocked until all checks pass',
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
        this.scene.start('MainMenu');
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

  private getTextureSizeLabel(key: string): string {
    const texture = this.textures.get(key);
    const source = texture.getSourceImage();
    const width = 'width' in source ? Number(source.width) : 0;
    const height = 'height' in source ? Number(source.height) : 0;
    return `${width}x${height}`;
  }

  private truncate(value: string, max: number): string {
    return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
  }
}
