export class BattleController {
  runBattle(): string[] {
    const logs: string[] = [];
    const waves = 3;
    const baseHp = 60;
    const bossHp = 180;
    const timeLimit = 20;
    const dps = 10;
    logs.push(`Battle：进入战斗，总 DPS ${dps.toFixed(1)}。`);

    for (let i = 1; i <= waves; i += 1) {
      const isElite = Math.random() < 0.25;
      const hp = baseHp * (isElite ? 1.5 : 1) * (1 + i * 0.2);
      const timeToKill = hp / dps;
      logs.push(`Wave ${i}：${isElite ? '精英' : '普通'}怪物 HP ${hp.toFixed(0)}。`);
      if (timeToKill <= timeLimit) {
        logs.push(`Wave ${i}：${timeToKill.toFixed(1)} 秒击败。`);
      } else {
        logs.push(`Wave ${i}：未能在 ${timeLimit}s 内击败，强行结算。`);
      }
    }

    const bossTime = bossHp / dps;
    logs.push(`Boss：HP ${bossHp}。`);
    if (bossTime <= timeLimit + 10) {
      logs.push(`Boss：${bossTime.toFixed(1)} 秒击败，胜利！`);
    } else {
      logs.push(`Boss：鏖战 ${bossTime.toFixed(1)} 秒，勉强取胜。`);
    }

    return logs;
  }

  private calculateDps(): number {
    return 10;
  }
}
