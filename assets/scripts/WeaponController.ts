import { Vec3 } from 'cc';

export interface WeaponDefinition {
  name: string;
  damage: number;
  interval: number;
  range: number;
}

export interface WeaponInstance extends WeaponDefinition {
  cellIndex: number;
  cooldown: number;
}

export interface EnemyTarget {
  position: Vec3;
  isAlive: () => boolean;
  takeDamage: (amount: number) => void;
}

export class WeaponController {
  weapons: WeaponInstance[] = [];

  addWeaponToCell(cellIndex: number, def: WeaponDefinition): WeaponInstance {
    const existingIndex = this.weapons.findIndex((weapon) => weapon.cellIndex === cellIndex);
    const instance: WeaponInstance = {
      ...def,
      cellIndex,
      cooldown: 0,
    };
    if (existingIndex >= 0) {
      this.weapons[existingIndex] = instance;
    } else {
      this.weapons.push(instance);
    }
    return instance;
  }

  tick(dt: number, enemies: EnemyTarget[], getCellWorldPos: (cellIndex: number) => Vec3): void {
    if (this.weapons.length === 0 || enemies.length === 0) {
      return;
    }

    this.weapons.forEach((weapon) => {
      weapon.cooldown = Math.max(0, weapon.cooldown - dt);
      const origin = getCellWorldPos(weapon.cellIndex);
      const target = this.findClosestEnemy(origin, weapon.range, enemies);
      if (!target || weapon.cooldown > 0) {
        return;
      }
      target.takeDamage(weapon.damage);
      weapon.cooldown = weapon.interval;
    });
  }

  private findClosestEnemy(origin: Vec3, range: number, enemies: EnemyTarget[]): EnemyTarget | null {
    let closest: EnemyTarget | null = null;
    let minDistance = Number.POSITIVE_INFINITY;
    enemies.forEach((enemy) => {
      if (!enemy.isAlive()) {
        return;
      }
      const distance = Vec3.distance(origin, enemy.position);
      if (distance <= range && distance < minDistance) {
        minDistance = distance;
        closest = enemy;
      }
    });
    return closest;
  }
}
