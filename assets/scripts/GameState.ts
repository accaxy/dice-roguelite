import { Vec3 } from 'cc';

export enum Phase {
  Explore = 'Explore',
  Battle = 'Battle',
}

export interface PlayerStats {
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

export class GameState {
  phase: Phase = Phase.Explore;
  position = 0;
  baseDice = 3;
  baseHp = 10;
  playerStats: PlayerStats = {
    atk: 10,
    atkSpeed: 1,
    crit: 0.1,
    hp: 100,
    gold: 0,
    shopDiscount: 0,
    weaponLevel: 1,
    skillLevel: 1,
    permanentDiceBonus: 0,
  };
  lastPlayerWorldPos: Vec3 = new Vec3();

  setPhase(next: Phase) {
    this.phase = next;
  }
}
