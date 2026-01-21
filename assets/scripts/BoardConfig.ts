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
  weaponIndices: number[] = [3, 8, 13, 18];
  healIndices: number[] = [5, 11, 16];
  buffIndices: number[] = [1, 9, 14];

  constructor(size = 20) {
    this.boardSize = size;
    this.tiles = this.createDefaultTiles(size);
  }

  private createDefaultTiles(size: number): BoardTile[] {
    const weaponSet = new Set(this.weaponIndices);
    const healSet = new Set(this.healIndices);
    const buffSet = new Set(this.buffIndices);
    const tiles: BoardTile[] = [];
    for (let i = 0; i < size; i += 1) {
      let type = TileType.Empty;
      if (weaponSet.has(i)) {
        type = TileType.Weapon;
      } else if (healSet.has(i)) {
        type = TileType.Heal;
      } else if (buffSet.has(i)) {
        type = TileType.Buff;
      }
      const tile: BoardTile = { type };
      if (type === TileType.Weapon || type === TileType.Skill) {
        tile.level = 1;
      }
      tiles.push(tile);
    }
    return tiles;
  }
}
