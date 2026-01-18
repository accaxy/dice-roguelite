import { PlayerStats } from './GameState';

export class BattleController {
  runBattle(stats: PlayerStats): string[] {
    const logs: string[] = [];
    const waves = 3;
    const baseHp = 60;
    const bossHp = 180;
    const timeLimit = 20;
    const dps = this.calculateDps(stats);
    logs.push(`Battle：进入战斗，总 DPS ${dps.toFixed(1)}。`);

    for (let i = 1; i <= waves; i += 1) {
      const isElite = Math.random() < 0.25;
      const hp = baseHp * (isElite ? 1.5 : 1) * (1 + i * 0.2);
      const timeToKill = hp / dps;
      logs.push(`Wave ${i}：${isElite ? '精英' : '普通'}怪物 HP ${hp.toFixed(0)}。`);
      if (timeToKill <= timeLimit) {
        logs.push(`Wave ${i}：${timeToKill.toFixed(1)} 秒击败。`);
        stats.gold += 3;
      } else {
        logs.push(`Wave ${i}：未能在 ${timeLimit}s 内击败，强行结算。`);
        stats.hp = Math.max(1, stats.hp - 10);
      }
    }

    const bossTime = bossHp / dps;
    logs.push(`Boss：HP ${bossHp}。`);
    if (bossTime <= timeLimit + 10) {
      logs.push(`Boss：${bossTime.toFixed(1)} 秒击败，胜利！`);
      stats.gold += 10;
    } else {
      logs.push(`Boss：鏖战 ${bossTime.toFixed(1)} 秒，勉强取胜。`);
      stats.hp = Math.max(1, stats.hp - 20);
    }

    return logs;
  }

  private calculateDps(stats: PlayerStats): number {
    const critMultiplier = 1 + stats.crit * 0.5;
    return Math.max(1, stats.atk * stats.atkSpeed * critMultiplier);
  }
}
