import { BoardTile, TileType } from './BoardConfig';
interface PlayerStats {
  atk: number;
  atkSpeed: number;
  crit: number;
  hp: number;
  gold: number;
  shopDiscount: number;
  weaponLevel: number;
  skillLevel: number;
  permanentDiceBonus: number;
}

export interface EventResult {
  log: string;
  extraDice?: number;
}

export class EventController {
  applyTile(tile: BoardTile, stats: PlayerStats): EventResult {
    switch (tile.type) {
      case TileType.Weapon:
        return this.applyWeapon(tile, stats);
      case TileType.Skill:
        return this.applySkill(tile, stats);
      case TileType.Fortune:
        return this.applyFortune(stats);
      case TileType.Shop:
        return this.applyShop(stats);
      case TileType.Dice:
        return this.applyDice(stats);
      case TileType.Empty:
      default:
        return { log: 'Empty：这里什么也没有发生。' };
    }
  }

  private applyWeapon(tile: BoardTile, stats: PlayerStats): EventResult {
    if (!tile.level) {
      tile.level = 1;
    }
    if (tile.level < 5) {
      tile.level += 1;
      stats.weaponLevel = Math.min(5, stats.weaponLevel + 1);
      stats.atk += 2;
      return { log: `Weapon：武器升级到 Lv.${tile.level}，攻击 +2。` };
    }
    stats.gold += 5;
    return { log: 'Weapon：武器已满级，转化为金币 +5。' };
  }

  private applySkill(tile: BoardTile, stats: PlayerStats): EventResult {
    if (!tile.level) {
      tile.level = 1;
    }
    if (tile.level < 5) {
      tile.level += 1;
      stats.skillLevel = Math.min(5, stats.skillLevel + 1);
      const roll = Math.floor(Math.random() * 4);
      if (roll === 0) {
        stats.atk += 1;
        return { log: `Skill：技能升级到 Lv.${tile.level}，攻击 +1。` };
      }
      if (roll === 1) {
        stats.atkSpeed += 0.1;
        return { log: `Skill：技能升级到 Lv.${tile.level}，攻速 +0.1。` };
      }
      if (roll === 2) {
        stats.crit += 0.05;
        return { log: `Skill：技能升级到 Lv.${tile.level}，暴击 +0.05。` };
      }
      stats.shopDiscount = Math.min(0.5, stats.shopDiscount + 0.05);
      return { log: `Skill：技能升级到 Lv.${tile.level}，商店折扣 +5%。` };
    }
    stats.gold += 5;
    return { log: 'Skill：技能已满级，转化为金币 +5。' };
  }

  private applyFortune(stats: PlayerStats): EventResult {
    const tiers = ['低', '中', '高'];
    const tierIndex = Math.floor(Math.random() * tiers.length);
    const roll = Math.floor(Math.random() * 6);
    const tier = tiers[tierIndex];
    switch (roll) {
      case 0:
        stats.atk += tierIndex === 2 ? 4 : 2;
        return { log: `Fortune：${tier}签，攻击提升。` };
      case 1:
        stats.atk = Math.max(1, stats.atk - (tierIndex === 0 ? 2 : 1));
        return { log: `Fortune：${tier}签，攻击下降。` };
      case 2:
        stats.atkSpeed += tierIndex === 2 ? 0.2 : 0.1;
        return { log: `Fortune：${tier}签，攻速提升。` };
      case 3:
        stats.atkSpeed = Math.max(0.3, stats.atkSpeed - 0.1);
        return { log: `Fortune：${tier}签，攻速下降。` };
      case 4:
        stats.crit += tierIndex === 2 ? 0.1 : 0.05;
        return { log: `Fortune：${tier}签，暴击提升。` };
      default:
        stats.hp = Math.max(1, stats.hp - (tierIndex === 0 ? 10 : 5));
        return { log: `Fortune：${tier}签，气血波动。` };
    }
  }

  private applyShop(stats: PlayerStats): EventResult {
    const options = ['攻击', '攻速', '暴击', '回血'];
    const pick = options[Math.floor(Math.random() * options.length)];
    if (pick === '攻击') {
      stats.atk += 1;
      return { log: 'Shop：购买攻击强化 +1。' };
    }
    if (pick === '攻速') {
      stats.atkSpeed += 0.1;
      return { log: 'Shop：购买攻速强化 +0.1。' };
    }
    if (pick === '暴击') {
      stats.crit += 0.05;
      return { log: 'Shop：购买暴击强化 +0.05。' };
    }
    stats.hp += 10;
    return { log: 'Shop：购买回复，生命 +10。' };
  }

  private applyDice(stats: PlayerStats): EventResult {
    const extra = Math.floor(Math.random() * 3) + 1;
    stats.gold += 1;
    return { log: `Dice：获得额外骰子 +${extra}。`, extraDice: extra };
  }
}
