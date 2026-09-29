
"use strict";

class GameModel {
  static WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  constructor() { this.score = { X: 0, O: 0, draws: 0 }; this.startRound(); }

  startRound() {
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameOver = false;
    this.result = null;
    this.winningLine = [];
    this.history = [];
    this.replayIndex = 0;
  }

  play(index) {
    if (this.gameOver || !Number.isInteger(index) || this.board[index]) return { accepted: false, reason: "invalid" };
    const player = this.currentPlayer;
    this.board[index] = player;
    this.history.push({ index, player });
    const winningLine = GameModel.WINNING_LINES.find(line => line.every(cell => this.board[cell] === player));
    if (winningLine) {
      this.gameOver = true; this.result = `${player}-win`; this.winningLine = winningLine; this.score[player] += 1;
    } else if (this.board.every(Boolean)) {
      this.gameOver = true; this.result = "draw"; this.score.draws += 1;
    } else {
      this.currentPlayer = player === "X" ? "O" : "X";
    }
    this.replayIndex = this.history.length;
    return { accepted: true };
  }

  replay(step) {
    if (!this.gameOver || !this.history.length) return;
    this.replayIndex = Math.max(0, Math.min(this.history.length, this.replayIndex + step));
    const snapshot = Array(9).fill("");
    this.history.slice(0, this.replayIndex).forEach(move => { snapshot[move.index] = move.player; });
    return snapshot;
  }

  resetScore() { this.score = { X: 0, O: 0, draws: 0 }; }
}

class GameView {
  constructor() {
    this.board = document.querySelector("#board");
    this.status = document.querySelector("#game-status");
    this.scoreX = document.querySelector("#score-x");
    this.scoreO = document.querySelector("#score-o");
    this.scoreDraw = document.querySelector("#score-draw");
    this.replayPanel = document.querySelector("#replay-panel");
    this.replayStatus = document.querySelector("#replay-status");
    this.previous = document.querySelector("#previous-move");
    this.next = document.querySelector("#next-move");
    this.cells = [];
    this.createCells();
  }

  createCells() {
    for (let index = 0; index < 9; index += 1) {
      const cell = document.createElement("button");
      cell.type = "button"; cell.className = "cell"; cell.dataset.index = String(index);
      cell.setAttribute("role", "gridcell"); this.board.appendChild(cell); this.cells.push(cell);
    }
  }

  render(model, replayBoard = null) {
    const board = replayBoard || model.board;
    this.cells.forEach((cell, index) => {
      const mark = board[index];
      cell.textContent = mark;
      cell.classList.toggle("mark-x", mark === "X"); cell.classList.toggle("mark-o", mark === "O");
      cell.classList.toggle("winner", !replayBoard && model.winningLine.includes(index));
      cell.disabled = Boolean(replayBoard) || model.gameOver || Boolean(mark);
      cell.setAttribute("aria-label", mark ? `Casa ${index + 1}: Jogador ${mark}` : `Casa ${index + 1}: vazia`);
    });
    this.scoreX.textContent = String(model.score.X); this.scoreO.textContent = String(model.score.O); this.scoreDraw.textContent = String(model.score.draws);
    if (replayBoard) {
      this.status.textContent = `Replay: ${model.replayIndex} de ${model.history.length} jogadas exibidas.`;
      this.replayStatus.textContent = `Passo ${model.replayIndex} de ${model.history.length}`;
    } else if (model.result === "X-win" || model.result === "O-win") this.status.textContent = `Vitória do Jogador ${model.result[0]}!`;
    else if (model.result === "draw") this.status.textContent = "Partida empatada!";
    else this.status.textContent = `Vez do Jogador ${model.currentPlayer}`;
    this.replayPanel.hidden = !model.gameOver;
    this.previous.disabled = !model.gameOver || model.replayIndex === 0;
    this.next.disabled = !model.gameOver || model.replayIndex === model.history.length;
  }
}

class GameController {
  constructor(model, view) {
    this.model = model; this.view = view; this.bindEvents(); this.render();
  }
  bindEvents() {
    this.view.cells.forEach(cell => cell.addEventListener("click", () => { this.model.play(Number(cell.dataset.index)); this.render(); }));
    document.querySelector("#new-game").addEventListener("click", () => { this.model.startRound(); this.render(); });
    document.querySelector("#reset-score").addEventListener("click", () => { if (window.confirm("Zerar todo o placar da sessão?")) { this.model.resetScore(); this.model.startRound(); this.render(); } });
    this.view.previous.addEventListener("click", () => { const board = this.model.replay(-1); this.render(board); });
    this.view.next.addEventListener("click", () => { const board = this.model.replay(1); this.render(board); });
  }
  render(replayBoard = null) { this.view.render(this.model, replayBoard); }
}

document.addEventListener("DOMContentLoaded", () => new GameController(new GameModel(), new GameView()));
