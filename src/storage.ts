import { LocalStorage } from "@raycast/api";
import { GameSettings, GameStats, AchievementsState, GameRunRecord } from "./types";

const STORAGE_KEYS = {
  SETTINGS: "tetris:settings:v1",
  STATS: "tetris:stats:v1",
  ACHIEVEMENTS: "tetris:achievements:v1",
};

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: "default",
  visualEffectsEnabled: true,
  colorPalette: "palette1",
  controlMode: "arrowKeys",
  pauseKey: "E",
  primaryKey: "Space",
  secondaryKey: "C",
};

export const DEFAULT_STATS: GameStats = {
  totalGamesPlayed: 0,
  bestScore: 0,
  bestLevel: 0,
  mostRowsCleared: 0,
  bestCombo: 0,
  totalScore: 0,
  totalPlayTimeMs: 0,
  bestRuns: [],
};

export const DEFAULT_ACHIEVEMENTS: AchievementsState = {
  unlocked: {},
  totalAchievements: 5,
};

export async function loadSettings(): Promise<GameSettings> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.SETTINGS);
    if (!stored) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await LocalStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export async function loadStats(): Promise<GameStats> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.STATS);
    if (!stored) return { ...DEFAULT_STATS, bestRuns: [] };
    return { ...DEFAULT_STATS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to load stats:", error);
    return { ...DEFAULT_STATS, bestRuns: [] };
  }
}

export async function saveStats(stats: GameStats): Promise<void> {
  try {
    await LocalStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save stats:", error);
  }
}

export async function updateStatsWithRun(
  score: number,
  level: number,
  rowsCleared: number,
  playTimeMs: number,
  difficulty: string,
  comboCount: number,
): Promise<void> {
  const stats = await loadStats();

  stats.totalGamesPlayed += 1;
  stats.totalScore += score;
  stats.totalPlayTimeMs += playTimeMs;

  if (score > stats.bestScore) stats.bestScore = score;
  if (level > stats.bestLevel) stats.bestLevel = level;
  if (rowsCleared > stats.mostRowsCleared) stats.mostRowsCleared = rowsCleared;
  if (comboCount > stats.bestCombo) stats.bestCombo = comboCount;

  const newRun: GameRunRecord = {
    score,
    level,
    rowsCleared,
    playTimeMs,
    difficulty: difficulty as GameStats["bestRuns"][0]["difficulty"],
    timestamp: new Date().toISOString(),
  };

  stats.bestRuns.push(newRun);
  stats.bestRuns.sort((a, b) => b.score - a.score);
  stats.bestRuns = stats.bestRuns.slice(0, 5);

  await saveStats(stats);
}

export async function loadAchievements(): Promise<AchievementsState> {
  try {
    const stored = await LocalStorage.getItem<string>(STORAGE_KEYS.ACHIEVEMENTS);
    if (!stored) return { ...DEFAULT_ACHIEVEMENTS, unlocked: {} };
    return { ...DEFAULT_ACHIEVEMENTS, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to load achievements:", error);
    return { ...DEFAULT_ACHIEVEMENTS, unlocked: {} };
  }
}

export async function saveAchievements(achievements: AchievementsState): Promise<void> {
  try {
    await LocalStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (error) {
    console.error("Failed to save achievements:", error);
  }
}

export async function resetStats(): Promise<void> {
  await saveStats(DEFAULT_STATS);
}

export async function resetAchievements(): Promise<void> {
  await saveAchievements(DEFAULT_ACHIEVEMENTS);
}

export async function resetAll(): Promise<void> {
  await resetStats();
  await resetAchievements();
}
