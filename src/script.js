const boardElement = document.getElementById("board");
const difficultySelect = document.getElementById("difficulty");
const bombProbabilityInput = document.getElementById("bombProbability");
const maxProbabilityInput = document.getElementById("maxProbability");
const newGameButton = document.getElementById("newGame");

const modal = document.getElementById("resultModal");
const closeButton = document.querySelector(".close-button");
const resultMessage = document.getElementById("resultMessage");

const settings = {
  easy: { size: 8, bombProbabilityRange: [0.05, 0.2], maxProbability: 0.2 },
  medium: { size: 12, bombProbabilityRange: [0.2, 0.35], maxProbability: 0.35 },
  hard: { size: 16, bombProbabilityRange: [0.35, 0.5], maxProbability: 0.5 },
};

let board, size, bombProbability, maxProbability;

function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function roundToTwoDecimals(number) {
  return Math.round(number * 100) / 100;
}

function updateProbabilities() {
  const difficulty = difficultySelect.value;
  const { bombProbabilityRange, maxProbability } = settings[difficulty];

  maxProbabilityInput.value = maxProbability;

  bombProbability = roundToTwoDecimals(
    getRandomInRange(bombProbabilityRange[0], bombProbabilityRange[1])
  );
  bombProbabilityInput.value = bombProbability;

  bombProbabilityInput.max = maxProbability;
}

function initGame() {
  const difficulty = difficultySelect.value;
  size = settings[difficulty].size;

  updateProbabilities();

  boardElement.style.gridTemplateColumns = `repeat(${size}, 30px)`;
  boardElement.style.gridTemplateRows = `repeat(${size}, 30px)`;

  board = createBoard(size, bombProbability);
  renderBoard(board);
}

difficultySelect.addEventListener("change", updateProbabilities);

bombProbabilityInput.addEventListener("input", () => {
  bombProbability = parseFloat(bombProbabilityInput.value);
  maxProbability = parseFloat(maxProbabilityInput.value);
  if (bombProbability > maxProbability) {
    bombProbabilityInput.value = maxProbability;
  }
});

maxProbabilityInput.addEventListener("input", () => {
  maxProbability = parseFloat(maxProbabilityInput.value);
  bombProbability = parseFloat(bombProbabilityInput.value);
  if (bombProbability > maxProbability) {
    bombProbabilityInput.value = maxProbability;
  }
});

function createBoard(size, bombProbability) {
  const board = [];
  for (let row = 0; row < size; row++) {
    const rowArray = [];
    for (let col = 0; col < size; col++) {
      rowArray.push({
        isBomb: Math.random() < bombProbability,
        revealed: false,
        flagged: false,
        adjacentBombs: 0,
      });
    }
    board.push(rowArray);
  }
  calculateAdjacentBombs(board);
  return board;
}

function calculateAdjacentBombs(board) {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].isBomb) continue;

      let adjacentBombs = 0;
      for (let [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        if (
          newRow >= 0 &&
          newRow < board.length &&
          newCol >= 0 &&
          newCol < board[row].length
        ) {
          if (board[newRow][newCol].isBomb) adjacentBombs++;
        }
      }
      board[row][col].adjacentBombs = adjacentBombs;
    }
  }
}

function renderBoard(board) {
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      cellElement.addEventListener("click", () =>
        handleCellClick(rowIndex, colIndex)
      );
      cellElement.addEventListener("contextmenu", (e) =>
        handleRightClick(e, rowIndex, colIndex)
      );
      boardElement.appendChild(cellElement);
    });
  });
}

function handleCellClick(row, col) {
  const cell = board[row][col];
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  const cellElement = boardElement.children[row * size + col];
  cellElement.classList.add("revealed");
  if (cell.isBomb) {
    cellElement.textContent = "💣";
    gameOver(false);
  } else {
    cellElement.textContent = cell.adjacentBombs || "";
    if (cell.adjacentBombs === 0) revealAdjacentCells(row, col);

    if (checkWin()) gameOver(true);
  }
}

function revealAdjacentCells(row, col) {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let [dx, dy] of directions) {
    const newRow = row + dx;
    const newCol = col + dy;
    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
      handleCellClick(newRow, newCol);
    }
  }
}

function handleRightClick(e, row, col) {
  e.preventDefault();
  const cell = board[row][col];
  if (cell.revealed) return;

  cell.flagged = !cell.flagged;
  const cellElement = boardElement.children[row * size + col];
  cellElement.classList.toggle("flagged");
  cellElement.textContent = cell.flagged ? "🚩" : "";
}

function checkWin() {
  return board.every((row) =>
    row.every(
      (cell) =>
        (cell.isBomb && !cell.revealed) || (!cell.isBomb && cell.revealed)
    )
  );
}

function gameOver(won) {
  resultMessage.textContent = won
    ? "Congratulations! You win!"
    : "Game over! You hit a bomb.";
  modal.style.display = "block";
}

newGameButton.addEventListener("click", initGame);

closeButton.addEventListener("click", () => {
  modal.style.display = "none";
  initGame();
});

window.addEventListener("click", (e) => {
  if (e.target == modal) {
    modal.style.display = "none";
    initGame();
  }
});

window.onload = initGame;
