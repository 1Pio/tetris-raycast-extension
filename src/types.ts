export type Difficulty = "default" | "medium" | "hard";
export type ColorPalette = "palette1" | "palette2";
export type ControlMode = "arrowKeys" | "wasd";
export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export type AchievementId = "block_placer" | "block_master" | "almost_impossible" | "board_master" | "secret";

export interface GameSettings {
  difficulty: Difficulty;
  visualEffectsEnabled: boolean;
  colorPalette: ColorPalette;
  controlMode: ControlMode;
  pauseKey: string;
  primaryKey: string;
  secondaryKey: string;
}

export interface GameStats {
  totalGamesPlayed: number;
  bestScore: number;
  bestLevel: number;
  mostRowsCleared: number;
  bestCombo: number;
  totalScore: number;
  totalPlayTimeMs: number;
  bestRuns: GameRunRecord[];
}

export interface GameRunRecord {
  score: number;
  level: number;
  rowsCleared: number;
  playTimeMs: number;
  difficulty: Difficulty;
  timestamp: string;
}

export interface AchievementsState {
  unlocked: Partial<Record<AchievementId, { unlockedAt: string }>>;
  totalAchievements: number;
}

export interface Cell {
  type: TetrominoType;
  color: string;
}

export type Board = (Cell | null)[];

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  rotation: number;
  x: number;
  y: number;
  color: string;
}

export interface GameState {
  board: Board;
  currentPiece: Tetromino | null;
  nextPiece: Tetromino | null;
  heldPiece: Tetromino | null;
  canHold: boolean;
  score: number;
  level: number;
  rowsCleared: number;
  comboCount: number;
  tetrisCount: number;
  isPaused: boolean;
  isGameOver: boolean;
  startedAt: number;
  activePlayTimeMs: number;
  lastTickTime: number;
  difficulty: Difficulty;
  colorPalette: ColorPalette;
  visualEffectsEnabled: boolean;
  lastLineClearName: string;
  lineClearTimeout: number | null;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BASE_TICK_INTERVAL = 800;
