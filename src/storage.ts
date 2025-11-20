import { LocalStorage } from "@raycast/api";
import { GameSettings, GameStats, SavedGameState, AchievementsState } from "./types";

const KEYS = {
  SETTINGS: "tetris:settings:v1",
  STATS: "tetris:stats:v1",
  SAVED_GAME: "tetris:saved-game:v1",
  ACHIEVEMENTS: "tetris:achievements:v1",
};

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: "default",
  visualEffectsEnabled: true,
  colorPalette: "palette1",
  controlMode: "arrowKeys",
  pauseKey: "E",
  primaryKey: "Space",
  secondaryKey: "C",
};

const DEFAULT_STATS: GameStats = {
  totalGamesPlayed: 0,
  bestScore: 0,
  bestLevel: 1,
  mostRowsCleared: 0,
  bestCombo: 0,
  totalScore: 0,
  totalPlayTimeMs: 0,
};

export async function loadSettings(): Promise<GameSettings> {
  const data = await LocalStorage.getItem<string>(KEYS.SETTINGS);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await LocalStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function loadStats(): Promise<GameStats> {
  const data = await LocalStorage.getItem<string>(KEYS.STATS);
  if (!data) return DEFAULT_STATS;
  try {
    return { ...DEFAULT_STATS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_STATS;
  }
}

export async function saveStats(stats: GameStats): Promise<void> {
  await LocalStorage.setItem(KEYS.STATS, JSON.stringify(stats));
}

export async function loadSavedGame(): Promise<SavedGameState | null> {
  const data = await LocalStorage.getItem<string>(KEYS.SAVED_GAME);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveGameState(state: SavedGameState): Promise<void> {
  await LocalStorage.setItem(KEYS.SAVED_GAME, JSON.stringify(state));
}

export async function clearSavedGame(): Promise<void> {
  await LocalStorage.removeItem(KEYS.SAVED_GAME);
}

export async function loadAchievements(): Promise<AchievementsState> {
  const data = await LocalStorage.getItem<string>(KEYS.ACHIEVEMENTS);
  if (!data) return { unlocked: {}, totalAchievements: 0 };
  try {
    return JSON.parse(data);
  } catch {
    return { unlocked: {}, totalAchievements: 0 };
  }
}

export async function saveAchievements(state: AchievementsState): Promise<void> {
  await LocalStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(state));
}
