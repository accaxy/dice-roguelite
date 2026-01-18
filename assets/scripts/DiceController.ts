export class DiceController {
  diceLeft = 0;

  resetDice(baseDice: number) {
    this.diceLeft = Math.max(0, baseDice);
  }

  roll(): number | null {
    if (this.diceLeft <= 0) {
      return null;
    }
    this.diceLeft -= 1;
    return Math.floor(Math.random() * 6) + 1;
  }

  addDice(extra: number) {
    this.diceLeft += Math.max(0, extra);
  }
}
