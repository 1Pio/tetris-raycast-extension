import { List } from "@raycast/api";
import { useEffect, useState } from "react";
import { GameStats, AchievementsState } from "./types";
import { loadStats, loadAchievements } from "./storage";
import { formatTime } from "./game-engine";

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
                <List.Item.Detail.Metadata.Label title="Best Score" text={stats.bestScore.toString()} />
                <List.Item.Detail.Metadata.Label title="Highest Level" text={stats.bestLevel.toString()} />
                <List.Item.Detail.Metadata.Label title="Most Rows Cleared" text={stats.mostRowsCleared.toString()} />
                <List.Item.Detail.Metadata.Label title="Best Combo" text={stats.bestCombo.toString()} />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Total Games Played" text={stats.totalGamesPlayed.toString()} />
                <List.Item.Detail.Metadata.Label title="Total Score" text={stats.totalScore.toString()} />
                <List.Item.Detail.Metadata.Label title="Total Play Time" text={formatTime(stats.totalPlayTimeMs)} />
                {stats.bestRuns.length > 0 && (
                  <>
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label title="Top 5 Runs" text="" />
                    {stats.bestRuns.map((run, index) => (
                      <List.Item.Detail.Metadata.Label
                        key={index}
                        title={`#${index + 1}`}
                        text={`${run.score} pts (Level ${run.level}, ${run.rowsCleared} rows, ${run.difficulty})`}
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
        subtitle={`${unlockedCount} / ${achievements.totalAchievements} unlocked`}
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label
                  title="Total Achievements"
                  text={achievements.totalAchievements.toString()}
                />
                <List.Item.Detail.Metadata.Label title="Unlocked" text={unlockedCount.toString()} />
                <List.Item.Detail.Metadata.Separator />
                {unlockedCount > 0 ? (
                  <>
                    <List.Item.Detail.Metadata.Label title="Unlocked Achievements" text="" />
                    {Object.entries(achievements.unlocked).map(([id, data]) => (
                      <List.Item.Detail.Metadata.Label
                        key={id}
                        title={id.replace(/_/g, " ").toUpperCase()}
                        text={new Date(data.unlockedAt).toLocaleDateString()}
                      />
                    ))}
                  </>
                ) : (
                  <List.Item.Detail.Metadata.Label title="No achievements unlocked yet" text="Keep playing!" />
                )}
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
    </List>
  );
}
