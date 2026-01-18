import { _decorator, Component, Button, Label, Node, UITransform } from 'cc';
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
}
