import { Color, Graphics, Label, Node, UITransform, Vec3 } from 'cc';
import { BoardConfig, BoardTile } from './BoardConfig';

export class BoardController {
  readonly config: BoardConfig;
  private boardRoot: Node | null = null;
  private playerNode: Node | null = null;
  private tileNodes: Node[] = [];
  private tileGraphics: Graphics[] = [];
  private tileContainer: Node | null = null;
  private currentIndex = 0;

  constructor(config: BoardConfig) {
    this.config = config;
  }

  bindView(boardRoot: Node, playerNode: Node): void {
    this.boardRoot = boardRoot;
    this.playerNode = playerNode;
    this.createBoardNodes();
    this.setCurrentIndex(this.config.startIndex);
  }

  private createBoardNodes(): void {
    if (!this.boardRoot) {
      return;
    }
    this.tileNodes = [];
    this.tileGraphics = [];

    if (this.tileContainer && this.tileContainer.isValid) {
      this.tileContainer.removeFromParent();
      this.tileContainer.destroy();
    }

    const existingContainer = this.boardRoot.getChildByName('BoardTiles');
    if (existingContainer) {
      existingContainer.removeFromParent();
      existingContainer.destroy();
    }

    const container = new Node('BoardTiles');
    container.setParent(this.boardRoot);
    this.tileContainer = container;

    const { tileSize, spacing, columns } = this.config;
    const rows = Math.ceil(this.config.tiles.length / columns);
    const totalWidth = columns * tileSize + (columns - 1) * spacing;
    const totalHeight = rows * tileSize + (rows - 1) * spacing;
    const offsetX = -totalWidth / 2 + tileSize / 2;
    const offsetY = totalHeight / 2 - tileSize / 2;

    for (let i = 0; i < this.config.tiles.length; i += 1) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const node = new Node(`Tile-${i}`);
      const transform = node.addComponent(UITransform);
      transform.setContentSize(tileSize, tileSize);
      node.setPosition(new Vec3(offsetX + col * (tileSize + spacing), offsetY - row * (tileSize + spacing), 0));
      node.setParent(container);

      const graphics = node.addComponent(Graphics);
      this.tileGraphics.push(graphics);
      this.tileNodes.push(node);

      const labelNode = new Node('Label');
      const labelTransform = labelNode.addComponent(UITransform);
      labelTransform.setContentSize(tileSize, tileSize);
      labelNode.setParent(node);
      const label = labelNode.addComponent(Label);
      label.string = `${i + 1}`;
      label.fontSize = 22;
      label.color = new Color(240, 240, 240, 255);
    }

    this.refreshHighlightAndPlayer();
  }

  moveSteps(currentIndex: number, steps: number): { newIndex: number; tile: BoardTile } {
    const maxIndex = this.config.tiles.length - 1;
    const newIndex = Math.min(currentIndex + steps, maxIndex);
    this.setCurrentIndex(newIndex);
    return { newIndex, tile: this.config.tiles[newIndex] };
  }

  setCurrentIndex(index: number): void {
    const clampedIndex = Math.max(0, Math.min(index, this.config.tiles.length - 1));
    this.currentIndex = clampedIndex;
    this.refreshHighlightAndPlayer();
  }

  getTileLocalPos(index: number): Vec3 {
    const tileNode = this.tileNodes[index];
    return tileNode ? tileNode.getPosition() : new Vec3();
  }

  getTileWorldPos(index: number): Vec3 {
    const tileNode = this.tileNodes[index];
    return tileNode ? tileNode.getWorldPosition() : new Vec3();
  }

  refreshHighlightAndPlayer(): void {
    const { tileSize } = this.config;
    this.tileGraphics.forEach((graphics, index) => {
      const isCurrent = index === this.currentIndex;
      this.drawTile(graphics, tileSize, isCurrent);
    });

    if (!this.playerNode) {
      return;
    }
    const tileNode = this.tileNodes[this.currentIndex];
    if (tileNode) {
      const worldPos = tileNode.getWorldPosition();
      worldPos.y += tileSize * 0.35;
      this.playerNode.setWorldPosition(worldPos);
    }
  }

  private drawTile(graphics: Graphics, size: number, isCurrent: boolean): void {
    const fillColor = isCurrent ? new Color(80, 160, 255, 220) : new Color(60, 60, 60, 180);
    const strokeColor = isCurrent ? new Color(200, 230, 255, 255) : new Color(120, 120, 120, 255);
    graphics.clear();
    graphics.lineWidth = isCurrent ? 6 : 4;
    graphics.fillColor = fillColor;
    graphics.strokeColor = strokeColor;
    graphics.rect(-size / 2, -size / 2, size, size);
    graphics.fill();
    graphics.stroke();
  }

  getTile(index: number): BoardTile {
    return this.config.tiles[index];
  }
}
