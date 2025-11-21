import { List } from "@raycast/api";
import { useEffect, useState } from "react";
import { GameStats, AchievementsState } from "./types";
import { loadStats, loadAchievements } from "./storage";
import { formatTime } from "./game-engine";
import { ACHIEVEMENT_DEFINITIONS, isAchievementUnlocked } from "./achievements";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementsState | null>(null);
  const [selectedId, setSelectedId] = useState<string>("stats");

  useEffect(() => {
    async function load() {
      const [loadedStats, loadedAchievements] = await Promise.all([loadStats(), loadAchievements()]);
      setStats(loadedStats);
      setAchievements(loadedAchievements);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading || !stats || !achievements) {
    return <List isLoading={true} />;
  }

  const unlockedCount = Object.keys(achievements.unlocked).length;
  const totalAchievements = achievements.totalAchievements;
  const achievementPercentage = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  const averageScore = stats.totalGamesPlayed > 0 ? Math.round(stats.totalScore / stats.totalGamesPlayed) : 0;
  const averagePlayTime = stats.totalGamesPlayed > 0 ? Math.round(stats.totalPlayTimeMs / stats.totalGamesPlayed) : 0;

  return (
    <List selectedItemId={selectedId} onSelectionChange={(id) => setSelectedId(id ?? "stats")}>
      <List.Item
        id="stats"
        title="Statistics"
        subtitle={`${stats.totalGamesPlayed} games played`}
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Personal Bests" text="" />
                <List.Item.Detail.Metadata.Label title="Best Score" text={stats.bestScore.toLocaleString()} />
                <List.Item.Detail.Metadata.Label title="Highest Level" text={stats.bestLevel.toString()} />
                <List.Item.Detail.Metadata.Label title="Most Rows Cleared" text={stats.mostRowsCleared.toString()} />
                <List.Item.Detail.Metadata.Label title="Best Combo" text={stats.bestCombo.toString()} />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Overall Statistics" text="" />
                <List.Item.Detail.Metadata.Label title="Total Games Played" text={stats.totalGamesPlayed.toString()} />
                <List.Item.Detail.Metadata.Label title="Total Score" text={stats.totalScore.toLocaleString()} />
                <List.Item.Detail.Metadata.Label title="Total Play Time" text={formatTime(stats.totalPlayTimeMs)} />
                <List.Item.Detail.Metadata.Label title="Average Score" text={averageScore.toLocaleString()} />
                <List.Item.Detail.Metadata.Label title="Average Play Time" text={formatTime(averagePlayTime)} />
                {stats.bestRuns.length > 0 && (
                  <>
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label title="Top 5 Best Runs" text="" />
                    {stats.bestRuns.map((run, index) => (
                      <List.Item.Detail.Metadata.Label
                        key={index}
                        title={`#${index + 1}`}
                        text={`${run.score.toLocaleString()} pts (Level ${run.level})`}
                      />
                    ))}
                  </>
                )}
              </List.Item.Detail.Metadata>
            }
          />
        }
      />

      <List.Item
        id="achievements"
        title="Achievements"
        subtitle={`${unlockedCount} / ${totalAchievements} unlocked (${achievementPercentage}%)`}
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Progress" text={`${unlockedCount} / ${totalAchievements}`} />
                <List.Item.Detail.Metadata.Label title="Completion" text={`${achievementPercentage}%`} />
                <List.Item.Detail.Metadata.Separator />
                {ACHIEVEMENT_DEFINITIONS.map((def) => {
                  const unlocked = isAchievementUnlocked(def.id, achievements);
                  const unlockedData = achievements.unlocked[def.id];
                  const title = unlocked ? `✓ ${def.name}` : `⬜ ${def.name}`;
                  let text = "";

                  if (unlocked && unlockedData) {
                    const date = new Date(unlockedData.unlockedAt).toLocaleDateString();
                    text = `${def.description} (Unlocked: ${date})`;
                  } else if (def.isSecret && !unlocked) {
                    text = "??? Secret achievement - play to unlock";
                  } else {
                    text = def.description;
                  }

                  return <List.Item.Detail.Metadata.Label key={def.id} title={title} text={text} />;
                })}
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
    </List>
  );
}
