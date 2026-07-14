export type LevelDefinition = {
  id: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  // Character mapping:
  // 'W' = Wall
  // '.' = Floor
  // 'P' = Player spawn point
  // 'C' = Pushable cube
  // 'T' = Torch
  // 'D' = Door
  // 'O' = Pressure plate
  // 'X' = Exit Portal (locked until objectives are solved)
  // 'L' = Lava
  // 'K' = Checkpoint
  // 'Y' = Crystal objective
  layout: string[];
};

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: "Dungeon Entry",
    gridWidth: 12,
    gridHeight: 9,
    layout: [
      "W W W W W W W W W W W W",
      "W . . . . . . . . . . W",
      "W . T . . . . . . T . W",
      "W . . P . . . . . . . W",
      "W . . . . C . . O . . W",
      "W . . . . . . . . . . W",
      "W . T . . . . . . T . W",
      "W . . . . . X . . . . W",
      "W W W W W W W W W W W W"
    ]
  },
  {
    id: 2,
    name: "The Dual Locks",
    gridWidth: 14,
    gridHeight: 10,
    layout: [
      "W W W W W W W W W W W W W W",
      "W . . . T . . . . T . . . W",
      "W . P . . . . . . . . . . W",
      "W . . . . C . . . C . . . W",
      "W W W W W W D D W W W W W W",
      "W . . . . . . . . . . . . W",
      "W . O . . . . . . . . O . W",
      "W . . . . . . . . . . . . W",
      "W . . . . . X . . . . . . W",
      "W W W W W W W W W W W W W W"
    ]
  },
  {
    id: 3,
    name: "Lava Pass",
    gridWidth: 16,
    gridHeight: 11,
    layout: [
      "W W W W W W W W W W W W W W W W",
      "W . . . . . . T . . . . . . . W",
      "W . P . . C . . . . . C . Y . W",
      "W . . . . . . K . . . . . . . W",
      "W W W W W L L L L L L W W W W W",
      "W . . . W L L L L L L W . . . W",
      "W . O . D . . . . . . D . O . W",
      "W . . . W L L L L L L W . . . W",
      "W W W W W L L L L L L W W W W W",
      "W . . . . . . X . . . . . . . W",
      "W W W W W W W W W W W W W W W W"
    ]
  }
];
