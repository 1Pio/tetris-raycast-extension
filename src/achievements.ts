import { AchievementId, Difficulty, AchievementsState } from "./types";
import { loadAchievements, saveAchievements } from "./storage";

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  isSecret?: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "block_placer",
    name: "Block Placer",
    description: "Reach Level 10",
  },
  {
    id: "block_master",
    name: "Block Master",
    description: "Reach Level 25",
  },
  {
    id: "almost_impossible",
    name: "Almost Impossible",
    description: "Reach Level 15 on Hard difficulty",
  },
  {
    id: "board_master",
    name: "Board Master",
    description: "Clear four rows at once (Tetris) at least twice in one game",
  },
  {
    id: "secret",
    name: "Secret Master",
    description: "Achieve a combo of 10 or more",
    isSecret: true,
  },
];

export interface GameRunData {
  score: number;
  level: number;
  rowsCleared: number;
  difficulty: Difficulty;
  comboCount: number;
  tetrisCount: number;
}

export function checkAchievements(runData: GameRunData, achievements: AchievementsState): AchievementId[] {
  const newUnlocks: AchievementId[] = [];

  if (!achievements.unlocked["block_placer"] && runData.level >= 10) {
    newUnlocks.push("block_placer");
  }

  if (!achievements.unlocked["block_master"] && runData.level >= 25) {
    newUnlocks.push("block_master");
  }

  if (!achievements.unlocked["almost_impossible"] && runData.level >= 15 && runData.difficulty === "hard") {
    newUnlocks.push("almost_impossible");
  }

  if (!achievements.unlocked["board_master"] && runData.tetrisCount >= 2) {
    newUnlocks.push("board_master");
  }

  if (!achievements.unlocked["secret"] && runData.comboCount >= 10) {
    newUnlocks.push("secret");
  }

  return newUnlocks;
}

export async function unlockAchievements(achievementIds: AchievementId[]): Promise<void> {
  if (achievementIds.length === 0) return;

  const achievements = await loadAchievements();
  const now = new Date().toISOString();

  for (const id of achievementIds) {
    if (!achievements.unlocked[id]) {
      achievements.unlocked[id] = { unlockedAt: now };
    }
  }

  await saveAchievements(achievements);
}

export function getAchievementDefinition(id: AchievementId): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((def) => def.id === id);
}

export function isAchievementUnlocked(id: AchievementId, achievements: AchievementsState): boolean {
  return !!achievements.unlocked[id];
}
