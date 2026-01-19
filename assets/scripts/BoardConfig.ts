export enum TileType {
  Weapon = 'Weapon',
  Heal = 'Heal',
  Buff = 'Buff',
  Skill = 'Skill',
  Fortune = 'Fortune',
  Shop = 'Shop',
  Dice = 'Dice',
  Empty = 'Empty',
}

export interface BoardTile {
  type: TileType;
  level?: number;
}

export class BoardConfig {
  boardSize = 20;
  gridSize = 6;
  columns = 6;
  tileSize = 90;
  spacing = 12;
  startIndex = 0;
  tiles: BoardTile[] = [];

  constructor(size = 20) {
    this.boardSize = size;
    this.tiles = this.createDefaultTiles(size);
  }

  private createDefaultTiles(size: number): BoardTile[] {
    const types: TileType[] = [
      TileType.Weapon,
      TileType.Heal,
      TileType.Buff,
      TileType.Empty,
    ];
    const tiles: BoardTile[] = [];
    for (let i = 0; i < size; i += 1) {
      const type = types[Math.floor(Math.random() * types.length)];
      const tile: BoardTile = { type };
      if (type === TileType.Weapon || type === TileType.Skill) {
        tile.level = 1;
      }
      tiles.push(tile);
    }
    return tiles;
  }
}
