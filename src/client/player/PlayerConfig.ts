/**
 * Tunables for movement feel, camera juice, and VFX.
 * Keep all magic numbers here — never scatter them through scenes.
 */
export type PlayerConfig = {
  /** Top movement speed in px/s. */
  moveSpeed: number;
  /** Acceleration toward target velocity. */
  acceleration: number;
  /** Deceleration when input released. */
  deceleration: number;
  /** Speed above which movement uses the rolling anim. */
  rollSpeedThreshold: number;
  /** Physics body size (independent of art frame). */
  bodyWidth: number;
  bodyHeight: number;
  /** Display scale for the cube sprite. */
  displayScale: number;
  /** Tile size used for grid-aware cell tracking. */
  gridSize: number;
  /** Soften diagonal so it matches cardinal speed. */
  normalizeDiagonal: boolean;
  /** Camera follow lerp (0–1). Lower = smoother / floatier. */
  cameraLerp: number;
  /** Camera deadzone half-width / half-height. */
  cameraDeadzone: { width: number; height: number };
  /** Minimum pre-impact speed that triggers camera shake. */
  impactSpeedThreshold: number;
  /** Camera shake duration (ms) / intensity. */
  impactShake: { duration: number; intensity: number };
  /** Squash/stretch on stop. */
  stopSquash: { scaleX: number; scaleY: number; durationMs: number };
  /** Glow / shadow presentation. */
  glow: { radius: number; color: number; alpha: number };
  shadow: { width: number; height: number; offsetY: number; alpha: number };
  /** Particle rates keyed off movement speed (0–1 of moveSpeed). */
  dust: { quantity: number; speedMin: number; speedMax: number };
  ember: { quantity: number; speedMin: number; speedMax: number };
  /** Virtual joystick. */
  joystick: {
    radius: number;
    knobRadius: number;
    marginLeft: number;
    marginBottom: number;
    deadzone: number;
  };
};

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  moveSpeed: 220,
  acceleration: 1800,
  deceleration: 2200,
  rollSpeedThreshold: 140,
  bodyWidth: 36,
  bodyHeight: 36,
  displayScale: 0.28,
  gridSize: 64,
  normalizeDiagonal: true,
  cameraLerp: 0.1,
  cameraDeadzone: { width: 40, height: 30 },
  impactSpeedThreshold: 160,
  impactShake: { duration: 120, intensity: 0.006 },
  stopSquash: { scaleX: 1.18, scaleY: 0.82, durationMs: 110 },
  glow: { radius: 42, color: 0xff6a1a, alpha: 0.35 },
  shadow: { width: 46, height: 16, offsetY: 22, alpha: 0.35 },
  dust: { quantity: 1, speedMin: 10, speedMax: 40 },
  ember: { quantity: 1, speedMin: 20, speedMax: 60 },
  joystick: {
    radius: 64,
    knobRadius: 28,
    marginLeft: 96,
    marginBottom: 96,
    deadzone: 0.18,
  },
};
