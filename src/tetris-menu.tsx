import { ActionPanel, Action, Icon, List } from "@raycast/api";

export default function Command() {
  return (
    <List searchBarPlaceholder="Select an option">
      <List.Item
        icon={Icon.Play}
        title="Start New Game"
        subtitle="Begin a new game of Tetris"
        actions={
          <ActionPanel>
            <Action.Push icon={Icon.Play} title="Start Game" target={<PlayCommand />} />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.Gear}
        title="Settings"
        subtitle="Configure game preferences"
        actions={
          <ActionPanel>
            <Action.Push icon={Icon.Gear} title="Open Settings" target={<SettingsCommand />} />
          </ActionPanel>
        }
      />
      <List.Item
        icon={Icon.BarChart}
        title="Stats & Achievements"
        subtitle="View your statistics and achievements"
        actions={
          <ActionPanel>
            <Action.Push icon={Icon.BarChart} title="View Stats" target={<StatsCommand />} />
          </ActionPanel>
        }
      />
    </List>
  );
}

import PlayCommand from "./play";
import SettingsCommand from "./settings";
import StatsCommand from "./stats";
