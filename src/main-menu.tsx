import { ActionPanel, Action, List, Icon, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import PlayCommand from "./play";
import SettingsCommand from "./settings";
import StatsCommand from "./stats";
import { loadSavedGame } from "./storage";

export default function MainMenu() {
  const { push } = useNavigation();
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    loadSavedGame().then((game) => {
      if (game) setHasSavedGame(true);
    });
  }, []);

  return (
    <List navigationTitle="Tetris">
      <List.Section title="Game">
        <List.Item
          title="Start New Game"
          icon={Icon.GameController}
          actions={
            <ActionPanel>
              <Action
                title="Start Game"
                onAction={() => push(<PlayCommand />)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Resume Game"
          subtitle={hasSavedGame ? "Continue where you left off" : "No saved game"}
          icon={Icon.Clock}
          actions={
            <ActionPanel>
              {hasSavedGame && (
                <Action
                  title="Resume"
                  onAction={() => push(<PlayCommand resume />)}
                />
              )}
            </ActionPanel>
          }
        />

      </List.Section>
      <List.Section title="Extras">
        <List.Item
          title="Stats & Achievements"
          icon={Icon.Trophy}
          actions={
            <ActionPanel>
              <Action.Push title="View Stats" target={<StatsCommand />} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Settings"
          icon={Icon.Gear}
          actions={
            <ActionPanel>
              <Action.Push title="Open Settings" target={<SettingsCommand />} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
