# dice-roguelite
## 在 Cocos Creator 中挂载并运行
1. 打开项目后，在层级管理器中新建一个空节点（例如命名为 `GameRoot`）。
2. 将 `assets/scripts/GameRoot.ts` 挂载到该节点，并在属性检查器中绑定 `rollButton`、`infoLabel`、`diceLeftLabel`。
3. 在 Canvas 下创建一个 Button（文本写“掷骰”）和两个 Label，用于展示日志与剩余骰子次数。
4. （可选）创建一个空节点作为 `boardRoot`，以及一个空节点作为 `playerNode` 并绑定；未绑定时脚本会自动生成简单棋盘与棋子。
5. 点击运行后，按下“掷骰”按钮即可在日志里看到移动与事件效果。
