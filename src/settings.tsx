import { ActionPanel, Action, Form, showToast, Toast, useNavigation, confirmAlert, Alert, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { GameSettings, Difficulty, ColorPalette, ControlMode } from "./types";
import { loadSettings, saveSettings, resetStats, resetAchievements, resetAll } from "./storage";

export default function Command() {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    async function load() {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(values: {
    difficulty: Difficulty;
    visualEffectsEnabled: boolean;
    colorPalette: ColorPalette;
    controlMode: ControlMode;
    pauseKey: string;
    primaryKey: string;
    secondaryKey: string;
  }) {
    const newSettings: GameSettings = {
      difficulty: values.difficulty,
      visualEffectsEnabled: values.visualEffectsEnabled,
      colorPalette: values.colorPalette,
      controlMode: values.controlMode,
      pauseKey: values.pauseKey,
      primaryKey: values.primaryKey,
      secondaryKey: values.secondaryKey,
    };

    await saveSettings(newSettings);
    await showToast({
      style: Toast.Style.Success,
      title: "Settings saved",
      message: "Your preferences have been updated",
    });
    pop();
  }

  async function handleResetStats() {
    const confirmed = await confirmAlert({
      title: "Reset Statistics",
      message: "Are you sure you want to reset all your game statistics? This action cannot be undone.",
      icon: Icon.Trash,
      primaryAction: {
        title: "Reset Stats",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await resetStats();
      await showToast({
        style: Toast.Style.Success,
        title: "Statistics reset",
        message: "All your game stats have been cleared",
      });
    }
  }

  async function handleResetAchievements() {
    const confirmed = await confirmAlert({
      title: "Reset Achievements",
      message: "Are you sure you want to reset all your achievements? This action cannot be undone.",
      icon: Icon.Trash,
      primaryAction: {
        title: "Reset Achievements",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await resetAchievements();
      await showToast({
        style: Toast.Style.Success,
        title: "Achievements reset",
        message: "All your achievements have been cleared",
      });
    }
  }

  async function handleResetAll() {
    const confirmed = await confirmAlert({
      title: "Reset Everything",
      message: "Are you sure you want to reset ALL statistics and achievements? This action cannot be undone.",
      icon: Icon.Trash,
      primaryAction: {
        title: "Reset Everything",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      await resetAll();
      await showToast({
        style: Toast.Style.Success,
        title: "Everything reset",
        message: "All stats and achievements have been cleared",
      });
    }
  }

  if (isLoading || !settings) {
    return <Form isLoading={true} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Settings" onSubmit={handleSubmit} />
          <ActionPanel.Section title="Reset Data">
            <Action title="Reset Statistics" icon={Icon.Trash} onAction={handleResetStats} />
            <Action title="Reset Achievements" icon={Icon.Trash} onAction={handleResetAchievements} />
            <Action
              title="Reset Everything"
              icon={Icon.Trash}
              onAction={handleResetAll}
              shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.Dropdown id="difficulty" title="Difficulty" defaultValue={settings.difficulty}>
        <Form.Dropdown.Item value="default" title="Default (Easy)" />
        <Form.Dropdown.Item value="medium" title="Medium" />
        <Form.Dropdown.Item value="hard" title="Hard" />
      </Form.Dropdown>

      <Form.Checkbox
        id="visualEffectsEnabled"
        label="Enable Visual Effects"
        defaultValue={settings.visualEffectsEnabled}
        info="Toggles ghost piece and visual aids"
      />

      <Form.Dropdown id="colorPalette" title="Color Palette" defaultValue={settings.colorPalette}>
        <Form.Dropdown.Item value="palette1" title="Palette 1 (Modern)" />
        <Form.Dropdown.Item value="palette2" title="Palette 2 (Classic)" />
      </Form.Dropdown>

      <Form.Dropdown id="controlMode" title="Control Mode" defaultValue={settings.controlMode}>
        <Form.Dropdown.Item value="arrowKeys" title="Arrow Keys" />
        <Form.Dropdown.Item value="wasd" title="WASD" />
      </Form.Dropdown>

      <Form.Separator />

      <Form.Dropdown id="pauseKey" title="Pause Key" defaultValue={settings.pauseKey}>
        <Form.Dropdown.Item value="E" title="E" />
        <Form.Dropdown.Item value="P" title="P" />
        <Form.Dropdown.Item value="Escape" title="Escape" />
      </Form.Dropdown>

      <Form.Dropdown id="primaryKey" title="Primary Key (Hard Drop)" defaultValue={settings.primaryKey}>
        <Form.Dropdown.Item value="Space" title="Space" />
        <Form.Dropdown.Item value="Enter" title="Enter" />
      </Form.Dropdown>

      <Form.Dropdown id="secondaryKey" title="Secondary Key (Hold)" defaultValue={settings.secondaryKey}>
        <Form.Dropdown.Item value="C" title="C" />
        <Form.Dropdown.Item value="Shift" title="Shift" />
        <Form.Dropdown.Item value="Tab" title="Tab" />
      </Form.Dropdown>
    </Form>
  );
}
