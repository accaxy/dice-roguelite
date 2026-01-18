import { Node, UITransform, Vec3 } from 'cc';
import { BoardConfig, BoardTile } from './BoardConfig';

export class BoardController {
  readonly config: BoardConfig;
  private boardRoot: Node | null = null;
  private playerNode: Node | null = null;
  private tilePositions: Vec3[] = [];
  private tileNodes: Node[] = [];
  private tileSpacing = 80;

  constructor(config: BoardConfig) {
    this.config = config;
  }

  init(boardRoot: Node, playerNode: Node) {
    this.boardRoot = boardRoot;
    this.playerNode = playerNode;
    this.createBoardNodes();
    this.movePlayerToIndex(0);
  }

  private createBoardNodes() {
    if (!this.boardRoot) {
      return;
    }
    this.tilePositions = [];
    this.tileNodes = [];
    const startX = -(this.config.tiles.length - 1) * this.tileSpacing * 0.5;
    for (let i = 0; i < this.config.tiles.length; i += 1) {
      const node = new Node(`Tile-${i}`);
      const transform = node.addComponent(UITransform);
      transform.setContentSize(60, 60);
      node.setPosition(new Vec3(startX + i * this.tileSpacing, 0, 0));
      node.setParent(this.boardRoot);
      this.tileNodes.push(node);
      this.tilePositions.push(node.getWorldPosition());
    }
  }

  moveSteps(currentIndex: number, steps: number): { newIndex: number; tile: BoardTile } {
    const maxIndex = this.config.tiles.length - 1;
    const newIndex = Math.min(currentIndex + steps, maxIndex);
    this.movePlayerToIndex(newIndex);
    return { newIndex, tile: this.config.tiles[newIndex] };
  }

  movePlayerToIndex(index: number) {
    if (!this.playerNode) {
      return;
    }
    const tileNode = this.tileNodes[index];
    if (tileNode) {
      this.playerNode.setWorldPosition(tileNode.getWorldPosition());
    } else if (this.boardRoot) {
      const fallbackPos = new Vec3(index * this.tileSpacing, 0, 0);
      this.playerNode.setPosition(fallbackPos);
    }
  }

  getTile(index: number): BoardTile {
    return this.config.tiles[index];
  }
}
