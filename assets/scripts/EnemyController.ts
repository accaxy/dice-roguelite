import { Color, Label, Node, UITransform, Vec3 } from 'cc';
import { BoardController } from './BoardController';

export interface EnemyControllerOptions {
  boardController: BoardController;
  boardRoot: Node;
  enemyRoot: Node;
  spawnInterval?: number;
  enemySpeed?: number;
  enemyDamage?: number;
  onEnemyHit?: (targetIndex: number, damage: number) => void;
}

export interface WaveDefinition {
  type: EnemyType;
  spawnCount: number;
  spawnInterval: number;
}

export type EnemyType = 'normal' | 'elite' | 'boss';

interface EnemyStats {
  name: string;
  maxHp: number;
  damage: number;
  attackInterval: number;
  speed: number;
  color: Color;
}

interface EnemyEntry {
  node: Node;
  targetIndex: number;
  targetPosition: Vec3;
  hp: number;
  maxHp: number;
  attackInterval: number;
  attackTimer: number;
  damage: number;
  speed: number;
  arrived: boolean;
  type: EnemyType;
  label: Label | null;
  id: number;
}

export class EnemyController {
  private boardController: BoardController;
  private boardRoot: Node;
  private enemyRoot: Node;
  private spawnTimer = 0;
  private spawnEnabled = true;
  private enemies: EnemyEntry[] = [];
  private onEnemyHit?: (targetIndex: number, damage: number) => void;
  private totalToSpawn = 0;
  private spawnedCount = 0;
  private currentWave: WaveDefinition | null = null;
  private waves: WaveDefinition[] = [
    { type: 'normal', spawnCount: 4, spawnInterval: 1.2 },
    { type: 'normal', spawnCount: 7, spawnInterval: 1.0 },
    { type: 'elite', spawnCount: 3, spawnInterval: 1.6 },
    { type: 'boss', spawnCount: 1, spawnInterval: 2.4 },
  ];
  private enemyId = 0;

  spawnInterval = 2.0;
  enemySpeed = 250;
  enemyDamage = 1;
  enemyAttackIntervalMultiplier = 1.0;

  private enemyStats: Record<EnemyType, EnemyStats> = {
    normal: {
      name: '普通',
      maxHp: 12,
      damage: 1,
      attackInterval: 1.3,
      speed: 220,
      color: new Color(220, 80, 80, 255),
    },
    elite: {
      name: '精英',
      maxHp: 28,
      damage: 2,
      attackInterval: 1.1,
      speed: 200,
      color: new Color(255, 140, 40, 255),
    },
    boss: {
      name: 'Boss',
      maxHp: 80,
      damage: 4,
      attackInterval: 0.9,
      speed: 160,
      color: new Color(180, 70, 255, 255),
    },
  };

  constructor(options: EnemyControllerOptions) {
    this.boardController = options.boardController;
    this.boardRoot = options.boardRoot;
    this.enemyRoot = options.enemyRoot;
    this.spawnInterval = options.spawnInterval ?? this.spawnInterval;
    this.enemySpeed = options.enemySpeed ?? this.enemySpeed;
    this.enemyDamage = options.enemyDamage ?? this.enemyDamage;
    this.onEnemyHit = options.onEnemyHit;
  }

  update(dt: number): void {
    if (this.spawnEnabled && this.spawnedCount < this.totalToSpawn) {
      this.spawnTimer += dt;
      while (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer -= this.spawnInterval;
        this.spawnEnemy();
      }
    }
    this.updateEnemies(dt);
  }

  stopSpawning(): void {
    this.spawnEnabled = false;
  }

  startWave(waveNo: number): void {
    this.spawnTimer = 0;
    this.spawnEnabled = true;
    this.enemies.forEach((enemy) => enemy.node.destroy());
    this.enemies = [];
    this.spawnedCount = 0;
    const waveIndex = Math.max(0, Math.min(this.waves.length - 1, waveNo - 1));
    this.currentWave = this.waves[waveIndex];
    this.spawnInterval = this.currentWave.spawnInterval;
    this.totalToSpawn = this.currentWave.spawnCount;
  }

  isWaveCleared(): boolean {
    return this.spawnedCount >= this.totalToSpawn && this.enemies.length === 0;
  }

  getEnemies(): EnemyEntry[] {
    return this.enemies;
  }

  damageEnemy(enemy: EnemyEntry, damage: number): void {
    enemy.hp = Math.max(0, enemy.hp - damage);
    this.updateEnemyLabel(enemy);
    if (enemy.hp <= 0) {
      enemy.node.destroy();
      this.enemies = this.enemies.filter((entry) => entry.id !== enemy.id);
    }
  }

  private spawnEnemy(): void {
    if (this.spawnedCount >= this.totalToSpawn) {
      return;
    }
    const enemyRootTransform = this.enemyRoot.getComponent(UITransform);
    if (!enemyRootTransform) {
      return;
    }
    const totalTiles = this.boardController.config.tiles.length;
    if (totalTiles <= 0) {
      return;
    }
    const targetIndex = Math.floor(Math.random() * totalTiles);
    const targetWorld = this.boardController.getTileWorldPos(targetIndex);
    const targetLocal = enemyRootTransform.convertToNodeSpaceAR(targetWorld);
    const stats = this.getStatsForWave();

    const enemyNode = new Node('Enemy');
    const transform = enemyNode.addComponent(UITransform);
    transform.setContentSize(40, 40);
    const label = enemyNode.addComponent(Label);
    label.string = `${stats.name}\n${stats.maxHp}/${stats.maxHp}`;
    label.fontSize = 16;
    label.color = stats.color;
    label.lineHeight = 18;
    enemyNode.setParent(this.enemyRoot);

    const startWorld = this.boardRoot.getWorldPosition();
    const startLocal = enemyRootTransform.convertToNodeSpaceAR(startWorld);
    enemyNode.setPosition(startLocal);

    const entry: EnemyEntry = {
      node: enemyNode,
      targetIndex,
      targetPosition: targetLocal,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      attackInterval: stats.attackInterval,
      attackTimer: 0,
      damage: stats.damage,
      speed: stats.speed,
      arrived: false,
      type: this.currentWave?.type ?? 'normal',
      label,
      id: this.enemyId++,
    };
    this.enemies.push(entry);
    this.spawnedCount += 1;
  }

  private updateEnemies(dt: number): void {
    if (this.enemies.length === 0) {
      return;
    }
    const remaining: EnemyEntry[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.node.isValid) {
        continue;
      }
      if (!enemy.arrived) {
        const moveDistance = enemy.speed * dt;
        const current = enemy.node.getPosition();
        const toTarget = new Vec3();
        Vec3.subtract(toTarget, enemy.targetPosition, current);
        const distance = toTarget.length();
        if (distance <= moveDistance) {
          enemy.node.setPosition(enemy.targetPosition);
          enemy.arrived = true;
          enemy.attackTimer = 0;
        } else {
          toTarget.normalize();
          const nextPos = new Vec3();
          Vec3.multiplyScalar(nextPos, toTarget, moveDistance);
          nextPos.add(current);
          enemy.node.setPosition(nextPos);
        }
      }
      if (enemy.arrived) {
        enemy.attackTimer += dt;
        while (enemy.attackTimer >= enemy.attackInterval) {
          enemy.attackTimer -= enemy.attackInterval;
          this.resolveHit(enemy);
        }
      }
      remaining.push(enemy);
    }
    this.enemies = remaining;
  }

  private resolveHit(enemy: EnemyEntry): void {
    if (this.onEnemyHit) {
      this.onEnemyHit(enemy.targetIndex, enemy.damage);
    }
  }

  private getStatsForWave(): EnemyStats {
    const waveType = this.currentWave?.type ?? 'normal';
    const base = this.enemyStats[waveType];
    const speedScale = this.enemySpeed / 250;
    const damageScale = this.enemyDamage;
    return {
      ...base,
      speed: base.speed * speedScale,
      damage: Math.max(1, Math.round(base.damage * damageScale)),
      attackInterval: base.attackInterval * this.enemyAttackIntervalMultiplier,
    };
  }

  private updateEnemyLabel(enemy: EnemyEntry): void {
    if (!enemy.label) {
      return;
    }
    enemy.label.string = `${this.enemyStats[enemy.type].name}\n${enemy.hp}/${enemy.maxHp}`;
  }

  getTotalWaves(): number {
    return this.waves.length;
  }
}
