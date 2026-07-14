export class Grid {
  private readonly blockedCells = new Set<string>();
  private readonly lavaCells = new Set<string>();
  private readonly plateCells = new Set<string>();
  private readonly portalCells = new Set<string>();

  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly cellSize: number = 64
  ) {}

  markBlocked(col: number, row: number, blocked = true): void {
    const key = `${col},${row}`;
    if (blocked) {
      this.blockedCells.add(key);
    } else {
      this.blockedCells.delete(key);
    }
  }

  markLava(col: number, row: number): void {
    this.lavaCells.add(`${col},${row}`);
  }

  markPlate(col: number, row: number): void {
    this.plateCells.add(`${col},${row}`);
  }

  markPortal(col: number, row: number): void {
    this.portalCells.add(`${col},${row}`);
  }

  isBlocked(col: number, row: number): boolean {
    return this.blockedCells.has(`${col},${row}`);
  }

  isLava(col: number, row: number): boolean {
    return this.lavaCells.has(`${col},${row}`);
  }

  isPlate(col: number, row: number): boolean {
    return this.plateCells.has(`${col},${row}`);
  }

  isPortal(col: number, row: number): boolean {
    return this.portalCells.has(`${col},${row}`);
  }

  getBlockedSet(): Set<string> {
    return this.blockedCells;
  }
}
