import { Detail } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadStats } from "./storage";
import { GameStats } from "./types";

export default function StatsCommand() {
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    loadStats().then(setStats);
  }, []);

  const markdown = `
# Your Tetris Statistics

Here is a summary of your Tetris career so far.
  `;

  return (
    <Detail
      isLoading={!stats}
      markdown={markdown}
      metadata={
        stats && (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Total Games Played" text={stats.totalGamesPlayed.toString()} />
            <Detail.Metadata.Label title="Best Score" text={stats.bestScore.toLocaleString()} />
            <Detail.Metadata.Label title="Best Level" text={stats.bestLevel.toString()} />
            <Detail.Metadata.Label title="Most Rows Cleared (Single Game)" text={stats.mostRowsCleared.toString()} />
            <Detail.Metadata.Label title="Best Combo" text={stats.bestCombo.toString()} />
            <Detail.Metadata.Label title="Total Score (Lifetime)" text={stats.totalScore.toLocaleString()} />
            <Detail.Metadata.Label 
                title="Total Play Time" 
                text={`${Math.floor(stats.totalPlayTimeMs / 1000 / 60)} mins`} 
            />
          </Detail.Metadata>
        )
      }
    />
  );
}
