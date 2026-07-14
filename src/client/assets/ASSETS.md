# Asset Management

Temple of Ash loads all visual assets through a single **AssetManager**. Scenes must never call `scene.load.spritesheet` / `scene.load.image` for game pack textures directly.

## Folder structure

```
public/assets/
  characters/       # player cube sheet
  tiles/            # floor / wall / lava
  doors/
  portals/
  interactive/      # torch, plate, crystal, beam, bridge, checkpoint
  props/
  decorations/      # reserved
  particles/        # reserved (particle frames currently on interactive sheets)
  effects/
  backgrounds/
  ui/
  audio/            # reserved
  assets.json       # generated catalog + detection report
```

Never duplicate PNG files across folders. One path per sheet.

## Naming rules

| Kind | Rule | Examples |
|------|------|----------|
| Sheet file | `snake_case.png` describing content | `player_cube.png`, `doors.png` |
| Catalog `name` | short logical id | `cube`, `door`, `torch` |
| Texture key | Phaser texture id (shared OK) | `torch_pillars` for torch + pillar |
| Frame (grid mode) | `{name}_{index}` | `torch_0` … `torch_9` |
| Animation | `{subject}_{state}` | `torch_idle`, `door_opening`, `cube_destroy` |

## Animation naming

- Loops: `*_idle`, `*_loop`, `lava_flow_*`
- One-shots: `*_opening`, `*_activate`, `*_destroy`, `*_extinguish`
- State machines keep the subject prefix stable (`door_closed` → `door_opening` → `door_open`)

Default rates live in `layoutOverrides.ts` (typically 6–12 fps). `repeat: -1` loops; `0` plays once.

## How loading works

1. **Preloader.preload** → `AssetManager.loadAssets(scene)`
2. **Preloader.create** → `AssetManager.createAnimations(scene)`
3. Gameplay → `AssetManager.spawnTorch(x, y)` / `playDoor(sprite, 'opening')` / etc.

Load modes:

- `spritesheet` — uniform full-image grid (`frameWidth` / `frameHeight` divide the PNG). Uses Phaser `load.spritesheet`.
- `grid` — labeled / multi-region concept sheets. Loaded as `load.image`, then frames are registered with `texture.add` using margin + spacing. **Source PNGs are never cropped.**
- `image` — single static texture (logo, boot background).

## Using assets in a scene

```ts
import { AssetManager } from '../assets/AssetManager';

create() {
  const torch = AssetManager.spawnTorch(200, 300);
  const door = AssetManager.createDoor(400, 300);
  const cube = AssetManager.spawnCube(512, 400);

  AssetManager.playDoor(door, 'opening');
  AssetManager.playCube(cube, 'move');
}
```

## Adding a new sprite sheet

1. Place the PNG under the correct folder (no copies).
2. Prefer a **clean uniform grid** so auto-detection can use `spritesheet` mode.
3. Add an entry in `src/client/assets/layoutOverrides.ts`:
   - `name`, `path`, `category`, `textureKey`
   - `frameWidth` / `frameHeight` / `columns` / `rows`
   - `animations[]` with `start` / `end` / `fps` / `repeat`
   - For labeled sheets: `loadMode: 'grid'` plus `margin` / `spacing`
4. Add spawn/play helpers on `AssetManager` if the asset is first-class.
5. Run `npm run assets:analyze` to regenerate `public/assets/assets.json` and print the detection report.

## Detection report

`SpriteSheetAnalyzer` scores candidate grids from image dimensions. When it cannot confirm a size it prints:

```
door.png
Unable to determine frame size.
Possible:
64x64
128x128
256x256
Needs confirmation.
```

Curated overrides (`detectionStatus: 'override'`) silence failure for known pack sheets while still logging that an override was applied.

## Asset Validation Scene

After preload, the game boots into **`AssetValidation`** instead of gameplay.

It will:

1. Run `validateAssetPipeline(scene)` against every catalog sheet
2. Render a scrollable gallery (wheel / drag) grouped by category
3. Auto-play every declared animation and cycle multi-anim assets
4. Show name, frame count, FPS, texture size, and animation names
5. Mark missing textures / animations / invalid frames in red
6. Print the console checklist:

```
✓ Assets Loaded
✓ Animations Loaded
✓ Missing Assets
✓ Missing Animations
✓ Invalid Frame Sizes
```

Main Menu stays blocked until `report.passed === true`.

Offline layout check (no browser):

```bash
npm run assets:validate
```
