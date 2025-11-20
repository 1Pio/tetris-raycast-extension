import { Tetromino, TetrominoType } from "./types";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Standard Tetromino definitions
export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    type: "I",
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  J: {
    type: "J",
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    type: "L",
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  O: {
    type: "O",
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  S: {
    type: "S",
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  T: {
    type: "T",
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  Z: {
    type: "Z",
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
};

export const PALETTES = {
  palette1: {
    I: "#39FF14", // Neon Green
    J: "#FF0000", // Saturated Red
    L: "#800080", // Vivid Purple
    O: "#FFA500", // Bright Orange
    S: "#0000FF", // Blue
    T: "#FFFF00", // Bright Yellow
    Z: "#00FFFF", // Bright Cyan
  },
  palette2: {
    I: "#00FFFF", // Neon Blue (Cyan-ish)
    J: "#0000FF", // Blue
    L: "#FFA500", // Orange
    O: "#FFFF00", // Yellow
    S: "#008000", // Green
    T: "#FF00FF", // Magenta
    Z: "#FF0000", // Red
  },
};

export const TICK_INTERVAL_BASE_MS = 800;
