import { ActivePiece, Board, BoardCell, TetrominoType } from "../types";
import { BOARD_HEIGHT, BOARD_WIDTH, TETROMINOES } from "../constants";

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function getTetrominoMatrix(type: TetrominoType, rotation: number): number[][] {
  const original = TETROMINOES[type].matrix;
  let matrix = original;
  // Rotate clockwise
  for (let i = 0; i < rotation % 4; i++) {
    matrix = matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
  }
  return matrix;
}

export function checkCollision(board: Board, piece: ActivePiece): boolean {
  const matrix = getTetrominoMatrix(piece.type, piece.rotation);
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;

        // Check bounds
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return true;
        }
        // Check existing blocks
        if (boardY >= 0 && board[boardY][boardX] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

export function mergePieceToBoard(board: Board, piece: ActivePiece, color: string): Board {
  const newBoard = board.map((row) => [...row]);
  const matrix = getTetrominoMatrix(piece.type, piece.rotation);

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = color;
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  let linesCleared = 0;
  const newBoard = board.filter((row) => {
    const isFull = row.every((cell) => cell !== null);
    if (isFull) linesCleared++;
    return !isFull;
  });

  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { newBoard, linesCleared };
}

export function getRandomTetrominoType(): TetrominoType {
  const types: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  return types[Math.floor(Math.random() * types.length)];
}

export function getGhostPosition(board: Board, piece: ActivePiece): Position {
  let ghostY = piece.position.y;
  // Simulate dropping until collision
  while (
    !checkCollision(board, {
      ...piece,
      position: { ...piece.position, y: ghostY + 1 },
    })
  ) {
    ghostY++;
  }
  return { x: piece.position.x, y: ghostY };
}

