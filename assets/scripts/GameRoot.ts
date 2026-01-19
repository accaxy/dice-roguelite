import { _decorator, Component, Button, Color, Label, Node, UITransform, Vec3 } from 'cc';
import { BoardConfig } from './BoardConfig';
import { BoardController } from './BoardController';
import { GameState, Phase } from './GameState';
import { EnemyController } from './EnemyController';
import { TileController } from './TileController';
import { WeaponController, WeaponDefinition } from './WeaponController';

const { ccclass, property } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property({ type: Button })
  rollButton: Button | null = null;

  @property({ type: Label })
  infoLabel: Label | null = null;

  @property({ type: Label })
  diceLeftLabel: Label | null = null;

  @property({ type: Label })
  baseHpLabel: Label | null = null;

  @property({ type: Node })
  playerNode: Node | null = null;

  @property({ type: Node })
  boardRoot: Node | null = null;

  @property({ type: Node })
  enemyRoot: Node | null = null;

  @property({ type: Number })
  spawnInterval = 2.0;

  @property({ type: Number })
  enemySpeed = 250;

  @property({ type: Number })
  enemyDamage = 1;

  private boardController: BoardController | null = null;
  private enemyController: EnemyController | null = null;
  private state = new GameState();
  private logLines: string[] = [];
  private boardConfig = new BoardConfig();
  private tileController: TileController | null = null;
  private weaponController = new WeaponController();
  private rewardPanel: Node | null = null;

  start() {
    this.ensureBoardNodes();
    this.boardController = new BoardController(this.boardConfig);
    if (this.boardRoot && this.playerNode) {
      this.boardController.bindView(this.boardRoot, this.playerNode);
      this.state.positionIndex = this.boardConfig.startIndex;
      this.boardController.setCurrentIndex(this.state.positionIndex);
    }

    this.state.phase = Phase.Explore;
    this.state.diceLeft = 3;
    this.refreshStatusLabel();
    this.log('探索开始：点击掷骰前进。');

    if (this.rollButton) {
      this.rollButton.node.on(Button.EventType.CLICK, this.handleRoll, this);
    } else {
      this.log('提示：请在编辑器中绑定掷骰按钮。');
    }

    this.setupEnemyController();
    this.setupTileController();
    this.updateRollButtonState();
  }

  private ensureBoardNodes() {
    if (!this.boardRoot) {
      const boardRoot = new Node('BoardRoot');
      boardRoot.addComponent(UITransform);
      boardRoot.setParent(this.node);
      this.boardRoot = boardRoot;
    }
    if (!this.playerNode) {
      const playerNode = new Node('Player');
      const transform = playerNode.addComponent(UITransform);
      transform.setContentSize(40, 40);
      playerNode.setParent(this.node);
      this.playerNode = playerNode;
    }
  }

  private handleRoll() {
    this.clearLog();
    if (this.state.phase !== Phase.Explore || this.state.diceLeft <= 0) {
      this.log('当前不在探索阶段。');
      return;
    }
    const roll = Math.floor(Math.random() * 6) + 1;
    if (!this.boardController) {
      return;
    }
    this.state.diceLeft -= 1;

    this.log(`掷骰结果：${roll}。`);
    const moveResult = this.boardController.moveSteps(this.state.positionIndex, roll);
    this.state.positionIndex = moveResult.newIndex;
    this.log(`抵达格子 ${moveResult.newIndex + 1}/${this.boardController.config.tiles.length}。`);
    this.refreshStatusLabel();
    this.resolveTile(moveResult.newIndex);
  }

  private resolveTile(index: number) {
    if (!this.tileController) {
      return;
    }
    const waiting = this.tileController.resolveTile(index, () => {
      if (this.state.phase === Phase.ChoosingReward) {
        this.state.setPhase(Phase.Explore);
      }
      this.refreshStatusLabel();
      this.updateRollButtonState();
      this.checkAutoBattle();
    });
    if (waiting) {
      this.state.setPhase(Phase.ChoosingReward);
      this.refreshStatusLabel();
      this.updateRollButtonState();
      return;
    }
    this.checkAutoBattle();
  }

  private checkAutoBattle() {
    if (this.state.phase !== Phase.ChoosingReward && this.state.diceLeft <= 0) {
      this.enterBattle();
    }
  }

  private enterBattle() {
    if (!this.enemyController) {
      return;
    }
    this.state.setPhase(Phase.Battle);
    this.updateRollButtonState();
    this.log('骰子用完，进入战斗阶段。');
    this.enemyController.startWave(this.state.waveNo);
    this.refreshStatusLabel();
  }

  private finishWave() {
    this.state.waveNo += 1;
    this.state.diceLeft = 3;
    this.state.setPhase(Phase.Explore);
    this.log('波次清完，回到探索。');
    this.refreshStatusLabel();
    this.updateRollButtonState();
  }

  private refreshStatusLabel() {
    if (this.diceLeftLabel) {
      this.diceLeftLabel.string = `阶段：${this.state.phase}\n骰子：${this.state.diceLeft}\n本体HP：${this.state.baseHP}\n波次：${this.state.waveNo}`;
    }
    if (this.baseHpLabel) {
      this.baseHpLabel.string = `BaseHP: ${this.state.baseHP}`;
    }
  }

  private log(message: string) {
    this.logLines = [...this.logLines, message].slice(-12);
    if (this.infoLabel) {
      this.infoLabel.string = this.logLines.join('\n');
    }
  }

  private clearLog() {
    this.logLines = [];
    if (this.infoLabel) {
      this.infoLabel.string = '';
    }
  }

  private ensureEnemyRoot() {
    if (this.enemyRoot && this.enemyRoot.isValid) {
      return this.enemyRoot;
    }
    const enemyRoot = new Node('EnemyRoot');
    enemyRoot.addComponent(UITransform);
    enemyRoot.setParent(this.node);
    this.enemyRoot = enemyRoot;
    return enemyRoot;
  }

  private setupEnemyController() {
    if (!this.boardController || !this.boardRoot) {
      return;
    }
    const enemyRoot = this.ensureEnemyRoot();
    this.enemyController = new EnemyController({
      boardController: this.boardController,
      boardRoot: this.boardRoot,
      enemyRoot,
      spawnInterval: this.spawnInterval,
      enemySpeed: this.enemySpeed,
      enemyDamage: this.enemyDamage,
      onEnemyHit: (targetIndex, damage) => {
        this.state.baseHP = Math.max(this.state.baseHP - damage, 0);
        this.refreshStatusLabel();
        this.log(`Enemy hit cell ${targetIndex + 1}, baseHP -${damage}`);
        if (this.state.baseHP <= 0) {
          this.state.setPhase(Phase.GameOver);
          this.log('游戏结束');
          this.enemyController?.stopSpawning();
          this.updateRollButtonState();
        }
      },
    });
  }

  private setupTileController() {
    this.tileController = new TileController({
      boardConfig: this.boardConfig,
      weaponController: this.weaponController,
      log: (message) => this.log(message),
      onHeal: (amount) => {
        this.state.baseHP += amount;
        this.refreshStatusLabel();
      },
      onBuff: (amount) => {
        this.state.diceLeft += amount;
        this.refreshStatusLabel();
      },
      showWeaponChoices: (options, onPick) => {
        this.showWeaponChoiceUI(options, onPick);
      },
    });
  }

  private updateRollButtonState() {
    if (!this.rollButton) {
      return;
    }
    this.rollButton.interactable = this.state.phase === Phase.Explore && this.state.diceLeft > 0;
  }

  private showWeaponChoiceUI(options: WeaponDefinition[], onPick: (def: WeaponDefinition) => void) {
    const panel = this.ensureRewardPanel();
    panel.removeAllChildren();
    panel.active = true;

    options.forEach((option, index) => {
      const buttonNode = new Node(`WeaponChoice-${index}`);
      const transform = buttonNode.addComponent(UITransform);
      transform.setContentSize(260, 60);
      buttonNode.setParent(panel);
      buttonNode.setPosition(0, 70 - index * 80);

      const label = buttonNode.addComponent(Label);
      label.string = `${option.name} 伤害:${option.damage} 冷却:${option.interval}s`;
      label.fontSize = 18;
      label.color = new Color(240, 240, 240, 255);

      const button = buttonNode.addComponent(Button);
      button.node.on(Button.EventType.CLICK, () => {
        panel.active = false;
        panel.removeAllChildren();
        onPick(option);
      });
    });
  }

  private ensureRewardPanel(): Node {
    if (this.rewardPanel && this.rewardPanel.isValid) {
      return this.rewardPanel;
    }
    const panel = new Node('RewardPanel');
    const transform = panel.addComponent(UITransform);
    transform.setContentSize(320, 260);
    panel.setParent(this.node);
    panel.setPosition(new Vec3(0, 0, 0));
    this.rewardPanel = panel;
    return panel;
  }

  update(dt: number) {
    if (this.state.phase !== Phase.Battle || !this.enemyController || !this.boardController) {
      return;
    }
    this.enemyController.update(dt);
    const enemies = this.enemyController.getEnemies().map((enemy) => ({
      position: enemy.node.getWorldPosition(),
      isAlive: () => enemy.node.isValid && enemy.hp > 0,
      takeDamage: (amount: number) => this.enemyController?.damageEnemy(enemy, amount),
    }));
    this.weaponController.tick(dt, enemies, (cellIndex) => this.boardController!.getTileWorldPos(cellIndex));
    if (this.enemyController.isWaveCleared()) {
      this.finishWave();
    }
  }
}
