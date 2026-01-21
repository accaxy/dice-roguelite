import { WeaponInstance } from './WeaponController';

export enum Phase {
  Explore = 'Explore',
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
  isChoosingReward = false;

  setPhase(next: Phase) {
    this.phase = next;
  }
}
