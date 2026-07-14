/**
 * High-level classification for every sprite sheet / logical asset.
 */
export const AssetCategory = {
  Torch: 'torch',
  Portal: 'portal',
  Door: 'door',
  PressurePlate: 'pressure_plate',
  Crystal: 'crystal',
  Cube: 'cube',
  Particles: 'particles',
  Bridge: 'bridge',
  Laser: 'laser',
  Tiles: 'tiles',
  Wall: 'wall',
  Ui: 'ui',
  Buttons: 'buttons',
  Icons: 'icons',
  Background: 'background',
  Props: 'props',
  Decorations: 'decorations',
  Checkpoint: 'checkpoint',
  Pillar: 'pillar',
  Effects: 'effects',
  Unknown: 'unknown',
} as const;

export type AssetCategoryId = (typeof AssetCategory)[keyof typeof AssetCategory];
