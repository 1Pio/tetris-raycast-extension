export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export type ColorPalette = "palette1" | "palette2";

export type Difficulty = "default" | "medium" | "hard";

export type ControlMode = "arrowKeys" | "wasd";

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
}

export interface Tetromino {
  type: TetrominoType;
  matrix: number[][]; // 1s and 0s
}

export interface Position {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: TetrominoType;
  position: Position;
  rotation: number; // 0, 1, 2, 3
}

// The board is a 2D array of colors (strings) or null
export type BoardCell = string | null;
export type Board = BoardCell[][];

export interface SavedGameState {
  board: Board;
  currentPiece: ActivePiece;
  nextQueue: TetrominoType[];
  heldPiece: TetrominoType | null;
  holdUsed: boolean;
  score: number;
  level: number;
  rowsCleared: number;
  comboCount: number;
  speedMultiplier: number;
  startedAt: number;
  totalActivePlayTimeMs: number;
  difficulty: Difficulty;
  settingsSnapshot: GameSettings;
}

export type AchievementId = "block_placer" | "block_master"; // extensible

export interface AchievementsState {
  unlocked: Record<string, { unlockedAt: string }>;
  totalAchievements: number;
}
