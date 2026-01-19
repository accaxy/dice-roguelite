import { _decorator, Component, Button, Label, Node, tween, UITransform, Vec3, Color } from 'cc';
import { BoardConfig } from './BoardConfig';
import { BoardController } from './BoardController';
import { DiceController } from './DiceController';
import { EventController } from './EventController';
import { BattleController } from './BattleController';
import { GameState, Phase } from './GameState';

const { ccclass, property } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property({ type: Button })
  rollButton: Button | null = null;

  @property({ type: Label })
  infoLabel: Label | null = null;

  @property({ type: Label })
  diceLeftLabel: Label | null = null;

  @property({ type: Node })
  playerNode: Node | null = null;

  @property({ type: Node })
  boardRoot: Node | null = null;

  @property({ type: Node })
  enemyRoot: Node | null = null;

  private boardController: BoardController | null = null;
  private diceController = new DiceController();
  private eventController = new EventController();
  private battleController = new BattleController();
  private state = new GameState();
  private logLines: string[] = [];
  private boardConfig = new BoardConfig();

  start() {
    this.ensureBoardNodes();
    this.boardController = new BoardController(this.boardConfig);
    if (this.boardRoot && this.playerNode) {
      this.boardController.bindView(this.boardRoot, this.playerNode);
      this.state.position = this.boardConfig.startIndex;
      this.boardController.setCurrentIndex(this.state.position);
    }

    const baseDice = this.state.baseDice + this.state.playerStats.permanentDiceBonus;
    this.diceController.resetDice(baseDice);
    this.refreshDiceLabel();
    this.log('探索开始：点击掷骰前进。');
    this.log(`本体生命：${this.state.baseHp}`);

    if (this.rollButton) {
      this.rollButton.node.on(Button.EventType.CLICK, this.handleRoll, this);
    } else {
      this.log('提示：请在编辑器中绑定掷骰按钮。');
    }
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
    if (this.state.phase !== Phase.Explore) {
      this.log('当前不在探索阶段。');
      return;
    }
    const roll = this.diceController.roll();
    if (roll === null || !this.boardController) {
      this.log('骰子已经用完。');
      this.enterBattle();
      return;
    }

    this.log(`掷骰结果：${roll}。`);
    const moveResult = this.boardController.moveSteps(this.state.position, roll);
    this.state.position = moveResult.newIndex;
    const eventResult = this.eventController.applyTile(moveResult.tile, this.state.playerStats);
    this.log(`抵达格子 ${moveResult.newIndex + 1}/${this.boardController.config.tiles.length}。`);
    this.log(eventResult.log);
    if (eventResult.extraDice) {
      this.diceController.addDice(eventResult.extraDice);
    }
    this.spawnEnemy();

    this.refreshDiceLabel();
    if (this.diceController.diceLeft <= 0) {
      this.enterBattle();
    }
  }

  private enterBattle() {
    this.state.setPhase(Phase.Battle);
    if (this.rollButton) {
      this.rollButton.interactable = false;
    }
    this.log('骰子用完，进入战斗阶段。');
    const logs = this.battleController.runBattle(this.state.playerStats);
    logs.forEach((line) => this.log(line));

    const baseDice = this.state.baseDice + this.state.playerStats.permanentDiceBonus;
    this.diceController.resetDice(baseDice);
    this.state.setPhase(Phase.Explore);
    this.log('战斗结束，回到探索。');
    if (this.rollButton) {
      this.rollButton.interactable = true;
    }
    this.refreshDiceLabel();
  }

  private refreshDiceLabel() {
    if (this.diceLeftLabel) {
      this.diceLeftLabel.string = `骰子次数：${this.diceController.diceLeft}`;
    }
  }

  private log(message: string) {
    this.logLines = [...this.logLines, message].slice(-8);
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

  private spawnEnemy() {
    if (!this.boardController || !this.boardRoot) {
      return;
    }
    const enemyRoot = this.ensureEnemyRoot();
    const enemyNode = new Node('Enemy');
    const transform = enemyNode.addComponent(UITransform);
    transform.setContentSize(40, 40);
    const label = enemyNode.addComponent(Label);
    label.string = 'Enemy';
    label.fontSize = 18;
    label.color = new Color(240, 100, 100, 255);
    enemyNode.setParent(enemyRoot);

    const enemyRootTransform = enemyRoot.getComponent(UITransform);
    if (!enemyRootTransform) {
      enemyNode.destroy();
      return;
    }

    const startWorld = this.boardRoot.getWorldPosition();
    const startLocal = enemyRootTransform.convertToNodeSpaceAR(startWorld);
    enemyNode.setPosition(startLocal);

    const totalTiles = this.boardController.config.tiles.length;
    const usePlayerTile = Math.random() < 0.5;
    const targetIndex = usePlayerTile
      ? this.state.position
      : Math.floor(Math.random() * Math.max(totalTiles, 1));
    const targetWorld = this.boardController.getTileWorldPos(targetIndex);
    const targetLocal = enemyRootTransform.convertToNodeSpaceAR(targetWorld);
    const distance = Vec3.distance(startLocal, targetLocal);
    const moveSpeed = 320;
    const duration = distance / moveSpeed;

    tween(enemyNode)
      .to(duration, { position: targetLocal })
      .call(() => {
        this.state.baseHp = Math.max(this.state.baseHp - 1, 0);
        this.log(`Enemy hit! -1 HP (Base HP: ${this.state.baseHp})`);
        enemyNode.destroy();
      })
      .start();
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
}
