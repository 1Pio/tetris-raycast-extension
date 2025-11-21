import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { GameSettings, Difficulty, ColorPalette, ControlMode } from "./types";
import { loadSettings, saveSettings } from "./storage";

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

  if (isLoading || !settings) {
    return <Form isLoading={true} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Settings" onSubmit={handleSubmit} />
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
