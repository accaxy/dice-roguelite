import { WeaponInstance } from './WeaponController';

export enum Phase {
  Explore = 'Explore',
  ChoosingReward = 'ChoosingReward',
  Battle = 'Battle',
  GameOver = 'GameOver',
}

export class GameState {
  phase: Phase = Phase.Explore;
  diceLeft = 3;
  baseHP = 10;
  waveNo = 1;
  positionIndex = 0;
  weapons: WeaponInstance[] = [];

  setPhase(next: Phase) {
    this.phase = next;
  }
}
