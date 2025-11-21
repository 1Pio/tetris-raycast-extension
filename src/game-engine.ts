import {
  TetrominoType,
  Tetromino,
  Board,
  Cell,
  GameState,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BASE_TICK_INTERVAL,
  Difficulty,
  ColorPalette,
} from "./types";

const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

const COLOR_PALETTES: Record<ColorPalette, Record<TetrominoType, string>> = {
  palette1: {
    I: "🟩",
    J: "🟥",
    L: "🟪",
    O: "🟧",
    S: "🟦",
    T: "🟨",
    Z: "🟦",
  },
  palette2: {
    I: "🟦",
    J: "🟦",
    L: "🟧",
    O: "🟨",
    S: "🟩",
    T: "🟪",
    Z: "🟥",
  },
};

export function createEmptyBoard(): Board {
  return Array(BOARD_WIDTH * BOARD_HEIGHT).fill(null);
}

export function createTetromino(type: TetrominoType, palette: ColorPalette): Tetromino {
  return {
    type,
    shape: TETROMINO_SHAPES[type],
    rotation: 0,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINO_SHAPES[type][0].length / 2),
    y: 0,
    color: COLOR_PALETTES[palette][type],
  };
}

export function getRandomTetromino(palette: ColorPalette): Tetromino {
  const types: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return createTetromino(randomType, palette);
}

export function rotatePiece(piece: Tetromino): Tetromino {
  const size = piece.shape.length;
  const rotated = Array(size)
    .fill(0)
    .map(() => Array(size).fill(0));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      rotated[x][size - 1 - y] = piece.shape[y][x];
    }
  }

  return {
    ...piece,
    shape: rotated,
    rotation: (piece.rotation + 1) % 4,
  };
}

export function isValidPosition(piece: Tetromino, board: Board): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;

        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return false;
        }

        if (boardY >= 0 && board[boardY * BOARD_WIDTH + boardX] !== null) {
          return false;
        }
      }
    }
  }
  return true;
}

export function lockPieceToBoard(piece: Tetromino, board: Board): Board {
  const newBoard = [...board];
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardY >= 0 && boardY < BOARD_HEIGHT) {
          const cell: Cell = { type: piece.type, color: piece.color };
          newBoard[boardY * BOARD_WIDTH + boardX] = cell;
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  let linesCleared = 0;
  const newBoard: Board = [];

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = board.slice(y * BOARD_WIDTH, (y + 1) * BOARD_WIDTH);
    const isFullRow = row.every((cell) => cell !== null);

    if (isFullRow) {
      linesCleared++;
    } else {
      newBoard.push(...row);
    }
  }

  while (newBoard.length < BOARD_WIDTH * BOARD_HEIGHT) {
    newBoard.unshift(null);
  }

  return { newBoard, linesCleared };
}

export function calculateScore(linesCleared: number, level: number, isHardDrop: boolean, dropDistance: number): number {
  let score = 0;

  switch (linesCleared) {
    case 1:
      score = 100 * level;
      break;
    case 2:
      score = 300 * level;
      break;
    case 3:
      score = 500 * level;
      break;
    case 4:
      score = 800 * level;
      break;
  }

  if (isHardDrop) {
    score += dropDistance * 2;
  }

  return score;
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  switch (difficulty) {
    case "default":
      return 1;
    case "medium":
      return 1.8;
    case "hard":
      return 3;
  }
}

export function getTickInterval(level: number, difficulty: Difficulty): number {
  const multiplier = getDifficultyMultiplier(difficulty);
  const levelFactor = Math.max(0.1, 1 - level * 0.05);
  return Math.floor(BASE_TICK_INTERVAL * levelFactor) / multiplier;
}

export function calculateLevel(rowsCleared: number): number {
  return Math.floor(rowsCleared / 10) + 1;
}

export function getDropDistance(piece: Tetromino, board: Board): number {
  let distance = 0;
  let testPiece = { ...piece };

  while (isValidPosition(testPiece, board)) {
    distance++;
    testPiece = { ...testPiece, y: testPiece.y + 1 };
  }

  return Math.max(0, distance - 1);
}

export function createInitialGameState(difficulty: Difficulty, palette: ColorPalette): GameState {
  return {
    board: createEmptyBoard(),
    currentPiece: getRandomTetromino(palette),
    nextPiece: getRandomTetromino(palette),
    heldPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    rowsCleared: 0,
    comboCount: 0,
    isPaused: false,
    isGameOver: false,
    startedAt: Date.now(),
    activePlayTimeMs: 0,
    lastTickTime: Date.now(),
    difficulty,
    colorPalette: palette,
  };
}

export function renderBoardAsMarkdown(state: GameState): string {
  if (state.isGameOver) {
    return `
# GAME OVER

Press "space" to quickly start a new round!
    `.trim();
  }

  const EMPTY_CELL = "⬛";
  const lines: string[] = [];
  lines.push("```");

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    let row = "│";
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const cell = state.board[y * BOARD_WIDTH + x];
      let char = EMPTY_CELL;

      if (cell) {
        char = cell.color;
      } else if (state.currentPiece) {
        const relX = x - state.currentPiece.x;
        const relY = y - state.currentPiece.y;
        if (
          relY >= 0 &&
          relY < state.currentPiece.shape.length &&
          relX >= 0 &&
          relX < state.currentPiece.shape[relY].length &&
          state.currentPiece.shape[relY][relX]
        ) {
          char = state.currentPiece.color;
        }
      }

      row += char;
    }
    row += "│";
    lines.push(row);
  }

  lines.push("└" + "──".repeat(BOARD_WIDTH) + "┘");
  lines.push("```");

  if (state.isPaused) {
    lines.push("\n**PAUSED**");
  }

  return lines.join("\n");
}

export function renderPiecePreview(piece: Tetromino | null): string {
  if (!piece) return "None";

  const EMPTY_CELL = "⬛";
  const lines: string[] = [];
  for (let y = 0; y < piece.shape.length; y++) {
    let row = "";
    for (let x = 0; x < piece.shape[y].length; x++) {
      row += piece.shape[y][x] ? piece.color : EMPTY_CELL;
    }
    const trimmedRow = row.replace(/⬛/g, "").trim();
    if (trimmedRow) lines.push(row);
  }

  return lines.join("\n") || piece.type;
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getLineClearName(linesCleared: number): string {
  switch (linesCleared) {
    case 1:
      return "Single";
    case 2:
      return "Double";
    case 3:
      return "Triple";
    case 4:
      return "Tetris";
    default:
      return "";
  }
}
