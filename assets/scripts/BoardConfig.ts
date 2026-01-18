export enum TileType {
  Weapon = 'Weapon',
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
  tiles: BoardTile[] = [];

  constructor(size = 20) {
    this.tiles = this.createDefaultTiles(size);
  }

  private createDefaultTiles(size: number): BoardTile[] {
    const types: TileType[] = [
      TileType.Weapon,
      TileType.Skill,
      TileType.Fortune,
      TileType.Shop,
      TileType.Dice,
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
