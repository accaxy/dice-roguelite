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

  tick(
    dt: number,
    enemies: EnemyTarget[],
    getCellWorldPos: (cellIndex: number) => Vec3,
    baseWorldPos: Vec3,
  ): void {
    if (this.weapons.length === 0) {
      return;
    }

    this.weapons.forEach((weapon) => {
      weapon.cooldown = Math.max(0, weapon.cooldown - dt);
      if (weapon.cooldown > 0) {
        return;
      }
      const origin = getCellWorldPos(weapon.cellIndex);
      const target = this.findPriorityEnemy(origin, weapon.range, baseWorldPos, enemies);
      if (!target) {
        return;
      }
      const damage = this.rollDamage(weapon.damage);
      target.takeDamage(damage);
      weapon.cooldown = weapon.interval;
    });
  }

  private findPriorityEnemy(origin: Vec3, range: number, baseWorldPos: Vec3, enemies: EnemyTarget[]): EnemyTarget | null {
    let closest: EnemyTarget | null = null;
    let minBaseDistance = Number.POSITIVE_INFINITY;
    let minWeaponDistance = Number.POSITIVE_INFINITY;
    enemies.forEach((enemy) => {
      if (!enemy.isAlive()) {
        return;
      }
      const weaponDistance = Vec3.distance(origin, enemy.position);
      if (weaponDistance > range) {
        return;
      }
      const baseDistance = Vec3.distance(baseWorldPos, enemy.position);
      if (baseDistance < minBaseDistance || (baseDistance === minBaseDistance && weaponDistance < minWeaponDistance)) {
        minBaseDistance = baseDistance;
        minWeaponDistance = weaponDistance;
        closest = enemy;
      }
    });
    return closest;
  }

  private rollDamage(maxDamage: number): number {
    const upper = Math.max(1, Math.floor(maxDamage));
    return Math.floor(Math.random() * upper) + 1;
  }
}
