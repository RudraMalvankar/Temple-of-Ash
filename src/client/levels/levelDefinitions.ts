export type LevelDefinition = {
  id: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  // Character mapping:
  // 'W' = Wall
  // '.' = Floor
  // 'P' = Player spawn point
  // 'C' = Pushable crate (wooden crate)
  // 'T' = Torch
  // 'D' = Door
  // 'O' = Pressure plate
  // 'X' = Exit Portal (locked until objectives are solved)
  // 'L' = Lava
  // 'K' = Checkpoint
  // 'Y' = Crystal objective
  // 'H' = Laser Horizontal
  // 'V' = Laser Vertical
  // 'B' = Bridge
  layout: string[];
};

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: "1. Dungeon Entry",
    gridWidth: 9,
    gridHeight: 5,
    layout: [
      "W W W W W W W W W",
      "W P . . W . . X W",
      "W W W . W . W W W",
      "W . . . . . . . W",
      "W W W W W W W W W"
    ]
  },
  {
    id: 2,
    name: "2. Crate Pushing",
    gridWidth: 9,
    gridHeight: 5,
    layout: [
      "W W W W W W W W W",
      "W P . . C . . X W",
      "W W W W . W W W W",
      "W . . . . . . . W",
      "W W W W W W W W W"
    ]
  },
  {
    id: 3,
    name: "3. Pressure Plates",
    gridWidth: 10,
    gridHeight: 5,
    layout: [
      "W W W W W W W W W W",
      "W P . . C . . O . W",
      "W W W W . W W W W W",
      "W . . . . . . . X W",
      "W W W W W W W W W W"
    ]
  },
  {
    id: 4,
    name: "4. Doors & Gates",
    gridWidth: 11,
    gridHeight: 5,
    layout: [
      "W W W W W W W W W W W",
      "W P . . W . . . . . W",
      "W . C . D . . X . . W",
      "W . O . W . . . . . W",
      "W W W W W W W W W W W"
    ]
  },
  {
    id: 5,
    name: "5. Lava Pools",
    gridWidth: 11,
    gridHeight: 6,
    layout: [
      "W W W W W W W W W W W",
      "W P . . . W . . . . W",
      "W . C . . D . . X . W",
      "W . L . . W . . . . W",
      "W . O . . W . . . . W",
      "W W W W W W W W W W W"
    ]
  },
  {
    id: 6,
    name: "6. Laser Beams",
    gridWidth: 11,
    gridHeight: 6,
    layout: [
      "W W W W W W W W W W W",
      "W P . . . W . . . . W",
      "W . C . . D . . X . W",
      "W . V . . W . . . . W",
      "W . O . . W . . . . W",
      "W W W W W W W W W W W"
    ]
  },
  {
    id: 7,
    name: "7. Bridge Puzzles",
    gridWidth: 11,
    gridHeight: 6,
    layout: [
      "W W W W W W W W W W W",
      "W P . . . W . . . . W",
      "W . C . . B . . X . W",
      "W . L . . W . . . . W",
      "W . O . . W . . . . W",
      "W W W W W W W W W W W"
    ]
  },
  {
    id: 8,
    name: "8. Temple of Ash",
    gridWidth: 14,
    gridHeight: 8,
    layout: [
      "W W W W W W W W W W W W W W",
      "W P . . . W . . . . . K . W",
      "W . C . . D . . Y . . C . W",
      "W . L . . W . . . . . O . W",
      "W . O . . W . . . . . . . W",
      "W W W W W W B B W W W W W W",
      "W . . . . . . . . . . X . W",
      "W W W W W W W W W W W W W W"
    ]
  }
];
