export const PlayerStateId = {
  Idle: 'idle',
  Moving: 'moving',
  Rolling: 'rolling',
  Stopping: 'stopping',
} as const;

export type PlayerStateIdValue = (typeof PlayerStateId)[keyof typeof PlayerStateId];

export type PlayerRuntimeState = {
  id: PlayerStateIdValue;
  /** World-space velocity (px/s). */
  velocityX: number;
  velocityY: number;
  /** Current speed magnitude. */
  speed: number;
  /** Normalized input currently applied. */
  inputX: number;
  inputY: number;
  /** Discrete grid cell under the player (puzzle-ready). */
  gridCol: number;
  gridRow: number;
  /** True while a stop squash tween is playing. */
  isSquashing: boolean;
  /** Previous frame blocked axes — used to detect heavy wall impacts. */
  wasBlockedX: boolean;
  wasBlockedY: boolean;
};

export const createInitialPlayerState = (
  worldX: number,
  worldY: number,
  gridSize: number
): PlayerRuntimeState => ({
  id: PlayerStateId.Idle,
  velocityX: 0,
  velocityY: 0,
  speed: 0,
  inputX: 0,
  inputY: 0,
  gridCol: Math.floor(worldX / gridSize),
  gridRow: Math.floor(worldY / gridSize),
  isSquashing: false,
  wasBlockedX: false,
  wasBlockedY: false,
});

export const resolveMovementState = (
  speed: number,
  hasInput: boolean,
  rollThreshold: number
): PlayerStateIdValue => {
  if (!hasInput && speed < 8) {
    return PlayerStateId.Idle;
  }
  if (!hasInput && speed >= 8) {
    return PlayerStateId.Stopping;
  }
  if (speed >= rollThreshold) {
    return PlayerStateId.Rolling;
  }
  return PlayerStateId.Moving;
};
