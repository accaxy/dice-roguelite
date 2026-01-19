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

interface EnemyEntry {
  node: Node;
  targetIndex: number;
  targetPosition: Vec3;
  hp: number;
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
  private enemyId = 0;

  spawnInterval = 2.0;
  enemySpeed = 250;
  enemyDamage = 1;

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
    this.totalToSpawn = 6 + waveNo * 2;
  }

  isWaveCleared(): boolean {
    return this.spawnedCount >= this.totalToSpawn && this.enemies.length === 0;
  }

  getEnemies(): EnemyEntry[] {
    return this.enemies;
  }

  damageEnemy(enemy: EnemyEntry, damage: number): void {
    enemy.hp = Math.max(0, enemy.hp - damage);
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

    const enemyNode = new Node('Enemy');
    const transform = enemyNode.addComponent(UITransform);
    transform.setContentSize(32, 32);
    const label = enemyNode.addComponent(Label);
    label.string = '怪';
    label.fontSize = 20;
    label.color = new Color(220, 80, 80, 255);
    enemyNode.setParent(this.enemyRoot);

    const startWorld = this.boardRoot.getWorldPosition();
    const startLocal = enemyRootTransform.convertToNodeSpaceAR(startWorld);
    enemyNode.setPosition(startLocal);

    this.enemies.push({
      node: enemyNode,
      targetIndex,
      targetPosition: targetLocal,
      hp: 10,
      id: this.enemyId++,
    });
    this.spawnedCount += 1;
  }

  private updateEnemies(dt: number): void {
    if (this.enemies.length === 0) {
      return;
    }
    const moveDistance = this.enemySpeed * dt;
    const remaining: EnemyEntry[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.node.isValid) {
        continue;
      }
      const current = enemy.node.getPosition();
      const toTarget = new Vec3();
      Vec3.subtract(toTarget, enemy.targetPosition, current);
      const distance = toTarget.length();
      if (distance <= moveDistance) {
        enemy.node.setPosition(enemy.targetPosition);
        this.resolveHit(enemy);
        continue;
      }
      toTarget.normalize();
      const nextPos = new Vec3();
      Vec3.multiplyScalar(nextPos, toTarget, moveDistance);
      nextPos.add(current);
      enemy.node.setPosition(nextPos);
      remaining.push(enemy);
    }
    this.enemies = remaining;
  }

  private resolveHit(enemy: EnemyEntry): void {
    if (this.onEnemyHit) {
      this.onEnemyHit(enemy.targetIndex, this.enemyDamage);
    }
    enemy.node.destroy();
  }
}
