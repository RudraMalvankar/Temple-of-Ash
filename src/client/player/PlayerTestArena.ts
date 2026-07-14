import type { Scene, Physics, GameObjects } from 'phaser';
import { AssetManager } from '../assets/AssetManager';

export type PlayerTestArena = {
  walls: Physics.Arcade.StaticGroup;
  lava: GameObjects.Sprite[];
  portal: GameObjects.Sprite;
  worldWidth: number;
  worldHeight: number;
};

/**
 * Minimal traversal sandbox for Player feel tests.
 * Not a puzzle level — only walls, lava strips, and an exit portal.
 */
export const createPlayerTestArena = (scene: Scene): PlayerTestArena => {
  const worldWidth = 1600;
  const worldHeight = 1200;
  const wallThickness = 48;

  scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  scene.cameras.main.setBackgroundColor(0x140e0c);

  // Floor wash — keeps the space from feeling empty without becoming a level.
  scene.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x1a1412).setDepth(0);

  const walls = scene.physics.add.staticGroup();

  const addWall = (x: number, y: number, w: number, h: number) => {
    const wall = scene.add.rectangle(x, y, w, h, 0x2a2420).setStrokeStyle(2, 0x3d342e);
    walls.add(wall);
  };

  // Outer bounds
  addWall(worldWidth / 2, wallThickness / 2, worldWidth, wallThickness);
  addWall(worldWidth / 2, worldHeight - wallThickness / 2, worldWidth, wallThickness);
  addWall(wallThickness / 2, worldHeight / 2, wallThickness, worldHeight);
  addWall(worldWidth - wallThickness / 2, worldHeight / 2, wallThickness, worldHeight);

  // Interior pillars for collision feel
  addWall(520, 420, 96, 220);
  addWall(980, 700, 160, 96);
  addWall(760, 320, 120, 120);

  walls.refresh();

  // Lava strips (animated hazard visuals — no damage logic yet)
  const lava: GameObjects.Sprite[] = [];
  const lavaPositions = [
    { x: 300, y: 900 },
    { x: 364, y: 900 },
    { x: 428, y: 900 },
    { x: 1100, y: 480 },
    { x: 1164, y: 480 },
  ];

  for (const pos of lavaPositions) {
    const tile = AssetManager.createTile(pos.x, pos.y, 48, scene);
    tile.setDepth(1);
    tile.setDisplaySize(64, 64);
    if (scene.anims.exists('lava_flow_a')) {
      tile.play('lava_flow_a');
    }
    lava.push(tile);
  }

  const portal = AssetManager.createPortal(1400, 280, scene);
  portal.setDepth(2);
  portal.setScale(0.35);

  // Soft ambient vignette feel via edge darkness already covered by walls.

  return { walls, lava, portal, worldWidth, worldHeight };
};
