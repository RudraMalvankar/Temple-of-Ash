export type LevelDefinition = {
  id: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  // Character mapping:
  // 'W' = Wall
  // '.' = Floor
  // 'P' = Player spawn point
  // 'C' = Pushable cube (wooden crate)
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
    name: "Dungeon Entry",
    gridWidth: 10,
    gridHeight: 9,
    layout: [
      "W W W W W W W W W W",
      "W . . . . . . . . W",
      "W . T . . . . T . W",
      "W . . . . . . . . W",
      "W . P . C . . O . W",
      "W . . . . . . . . W",
      "W . T . . . . T . W",
      "W . . . . X . . . W",
      "W W W W W W W W W W"
    ]
  },
  {
    id: 2,
    name: "Lava Crossing",
    gridWidth: 12,
    gridHeight: 9,
    layout: [
      "W W W W W W W W W W W W",
      "W . . . . . T . . . . W",
      "W . P . . . . . . Y . W",
      "W W W W L L L L W W W W",
      "W . . W L L L L W . . W",
      "W . O B . . . . B O . W",
      "W . . W L L L L W . . W",
      "W . C . . X . . . C . W",
      "W W W W W W W W W W W W"
    ]
  },
  {
    id: 3,
    name: "Ancient Chamber Gates",
    gridWidth: 14,
    gridHeight: 10,
    layout: [
      "W W W W W W W W W W W W W W",
      "W . . . . . . T . . . . . W",
      "W . P . . . . . . . . K . W",
      "W . . . . C . . . C . . . W",
      "W W W W W W D D W W W W W W",
      "W . . . . . . . . . . . . W",
      "W . O . . . . . . . . O . W",
      "W . . . . . Y . . . . . . W",
      "W . . . . . X . . . . . . W",
      "W W W W W W W W W W W W W W"
    ]
  }
];
