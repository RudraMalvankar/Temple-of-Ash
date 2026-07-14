type Handler<T> = (payload: T) => void;

export type PlayerMovePayload = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
};

export type PlayerStopPayload = {
  x: number;
  y: number;
};

export type PlayerImpactPayload = {
  speed: number;
  normalX: number;
  normalY: number;
};

export type PlayerStatePayload = {
  from: string;
  to: string;
};

export type PlayerGridCellPayload = {
  col: number;
  row: number;
};

export type CubeMovedPayload = {
  cubeId: string;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  /** Center of the tile the cube now occupies — pressure plates can listen for this. */
  x: number;
  y: number;
};

/**
 * Typed pub/sub for gameplay systems.
 * Explicit per-event APIs keep TypeScript sound without assertions.
 */
export class EventBus {
  private static readonly moveHandlers = new Set<Handler<PlayerMovePayload>>();
  private static readonly stopHandlers = new Set<Handler<PlayerStopPayload>>();
  private static readonly impactHandlers = new Set<Handler<PlayerImpactPayload>>();
  private static readonly stateHandlers = new Set<Handler<PlayerStatePayload>>();
  private static readonly gridHandlers = new Set<Handler<PlayerGridCellPayload>>();
  private static readonly cubeMovedHandlers = new Set<Handler<CubeMovedPayload>>();

  static onMove(handler: Handler<PlayerMovePayload>): () => void {
    EventBus.moveHandlers.add(handler);
    return () => {
      EventBus.moveHandlers.delete(handler);
    };
  }

  static onStop(handler: Handler<PlayerStopPayload>): () => void {
    EventBus.stopHandlers.add(handler);
    return () => {
      EventBus.stopHandlers.delete(handler);
    };
  }

  static onImpact(handler: Handler<PlayerImpactPayload>): () => void {
    EventBus.impactHandlers.add(handler);
    return () => {
      EventBus.impactHandlers.delete(handler);
    };
  }

  static onState(handler: Handler<PlayerStatePayload>): () => void {
    EventBus.stateHandlers.add(handler);
    return () => {
      EventBus.stateHandlers.delete(handler);
    };
  }

  static onGridCell(handler: Handler<PlayerGridCellPayload>): () => void {
    EventBus.gridHandlers.add(handler);
    return () => {
      EventBus.gridHandlers.delete(handler);
    };
  }

  static onCubeMoved(handler: Handler<CubeMovedPayload>): () => void {
    EventBus.cubeMovedHandlers.add(handler);
    return () => {
      EventBus.cubeMovedHandlers.delete(handler);
    };
  }

  static emitMove(payload: PlayerMovePayload): void {
    for (const handler of [...EventBus.moveHandlers]) {
      handler(payload);
    }
  }

  static emitStop(payload: PlayerStopPayload): void {
    for (const handler of [...EventBus.stopHandlers]) {
      handler(payload);
    }
  }

  static emitImpact(payload: PlayerImpactPayload): void {
    for (const handler of [...EventBus.impactHandlers]) {
      handler(payload);
    }
  }

  static emitState(payload: PlayerStatePayload): void {
    for (const handler of [...EventBus.stateHandlers]) {
      handler(payload);
    }
  }

  static emitGridCell(payload: PlayerGridCellPayload): void {
    for (const handler of [...EventBus.gridHandlers]) {
      handler(payload);
    }
  }

  static emitCubeMoved(payload: CubeMovedPayload): void {
    for (const handler of [...EventBus.cubeMovedHandlers]) {
      handler(payload);
    }
  }

  static clear(): void {
    EventBus.moveHandlers.clear();
    EventBus.stopHandlers.clear();
    EventBus.impactHandlers.clear();
    EventBus.stateHandlers.clear();
    EventBus.gridHandlers.clear();
    EventBus.cubeMovedHandlers.clear();
  }
}

/** Channel names for docs / debugging — prefer EventBus.emit* / on* methods. */
export const PlayerEvents = {
  Move: 'player:move',
  Stop: 'player:stop',
  Impact: 'player:impact',
  StateChanged: 'player:state',
  GridCellChanged: 'player:grid-cell',
} as const;

export const CubeEvents = {
  Moved: 'cubeMoved',
} as const;
