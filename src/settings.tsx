import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "./storage";
import { GameSettings } from "./types";

export default function SettingsCommand() {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [values, setValues] = useState<GameSettings | null>(null);

  useEffect(() => {
    async function load() {
      const settings = await loadSettings();
      setValues(settings);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(values: GameSettings) {
    await saveSettings(values);
    await showToast({
      style: Toast.Style.Success,
      title: "Settings saved",
    });
    pop();
  }

  if (isLoading || !values) {
    return <Form isLoading />;
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="difficulty"
        title="Difficulty"
        value={values.difficulty}
        onChange={(v) => setValues({ ...values, difficulty: v as "default" | "medium" | "hard" })}
      >
        <Form.Dropdown.Item value="default" title="Default" />
        <Form.Dropdown.Item value="medium" title="Medium" />
        <Form.Dropdown.Item value="hard" title="Hard" />
      </Form.Dropdown>

      <Form.Checkbox
        id="visualEffectsEnabled"
        label="Enable Visual Effects"
        value={values.visualEffectsEnabled}
        onChange={(v) => setValues({ ...values, visualEffectsEnabled: v })}
      />

      <Form.Dropdown
        id="colorPalette"
        title="Color Palette"
        value={values.colorPalette}
        onChange={(v) => setValues({ ...values, colorPalette: v as "palette1" | "palette2" })}
      >
        <Form.Dropdown.Item value="palette1" title="Palette 1 (Modern)" />
        <Form.Dropdown.Item value="palette2" title="Palette 2 (Classic)" />
      </Form.Dropdown>

      <Form.Dropdown
        id="controlMode"
        title="Control Mode"
        value={values.controlMode}
        onChange={(v) => setValues({ ...values, controlMode: v as "arrowKeys" | "wasd" })}
      >
        <Form.Dropdown.Item value="arrowKeys" title="Arrow Keys" />
        <Form.Dropdown.Item value="wasd" title="WASD" />
      </Form.Dropdown>


      <Form.TextField
        id="pauseKey"
        title="Pause Key"
        value={values.pauseKey}
        onChange={(v) => setValues({ ...values, pauseKey: v })}
      />

      <Form.TextField
        id="primaryKey"
        title="Primary Action Key (Hard Drop)"
        value={values.primaryKey}
        onChange={(v) => setValues({ ...values, primaryKey: v })}
      />

      <Form.TextField
        id="secondaryKey"
        title="Secondary Action Key (Hold)"
        value={values.secondaryKey}
        onChange={(v) => setValues({ ...values, secondaryKey: v })}
      />
    </Form>
  );
}
