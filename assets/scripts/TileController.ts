import { BoardConfig, TileType } from './BoardConfig';
import { WeaponController, WeaponDefinition } from './WeaponController';

export interface TileControllerOptions {
  boardConfig: BoardConfig;
  weaponController: WeaponController;
  log: (message: string) => void;
  onHeal: (amount: number) => void;
  onBuff: (amount: number) => void;
  showWeaponChoices: (options: WeaponDefinition[], onPick: (def: WeaponDefinition) => void) => void;
}

export class TileController {
  private tileTypes: TileType[];
  private weaponController: WeaponController;
  private log: (message: string) => void;
  private onHeal: (amount: number) => void;
  private onBuff: (amount: number) => void;
  private showWeaponChoices: (options: WeaponDefinition[], onPick: (def: WeaponDefinition) => void) => void;

  private weaponDefs: WeaponDefinition[] = [
    { name: '短剑', damage: 3, interval: 0.9, range: 220 },
    { name: '长枪', damage: 5, interval: 1.3, range: 260 },
    { name: '弩炮', damage: 4, interval: 0.7, range: 180 },
    { name: '法杖', damage: 6, interval: 1.6, range: 300 },
    { name: '飞刃', damage: 2, interval: 0.4, range: 160 },
  ];

  constructor(options: TileControllerOptions) {
    this.tileTypes = options.boardConfig.tiles.map((tile) => tile.type);
    this.weaponController = options.weaponController;
    this.log = options.log;
    this.onHeal = options.onHeal;
    this.onBuff = options.onBuff;
    this.showWeaponChoices = options.showWeaponChoices;
  }

  resolveTile(index: number, onComplete: () => void): boolean {
    const tileType = this.tileTypes[index] ?? TileType.Empty;
    if (tileType === TileType.Weapon) {
      const options = this.pickWeaponOptions();
      this.log('触发武器格：请选择一件武器。');
      this.showWeaponChoices(options, (def) => {
        this.weaponController.addWeaponToCell(index, def);
        this.log(`装备 ${def.name} 到格子 ${index + 1}。`);
        onComplete();
      });
      return true;
    }
    if (tileType === TileType.Heal) {
      const amount = 2;
      this.onHeal(amount);
      this.log(`治疗格：本体生命 +${amount}。`);
      onComplete();
      return false;
    }
    if (tileType === TileType.Buff) {
      const amount = 1;
      this.onBuff(amount);
      this.log(`增益格：额外骰子 +${amount}。`);
      onComplete();
      return false;
    }
    this.log('空白格：无事发生。');
    onComplete();
    return false;
  }

  private pickWeaponOptions(): WeaponDefinition[] {
    const shuffled = [...this.weaponDefs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
}
