import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

function settingsPath(): string {
  return path.join(app.getPath("userData"), "update-settings.json");
}

export function loadAutoUpdateEnabled(): boolean {
  try {
    const raw = fs.readFileSync(settingsPath(), "utf-8");
    const parsed = JSON.parse(raw) as { autoUpdateEnabled?: unknown };
    if (typeof parsed.autoUpdateEnabled === "boolean") {
      return parsed.autoUpdateEnabled;
    }
  } catch {
    // No saved settings yet, or the file is corrupt - default to off.
  }
  return false;
}

export function saveAutoUpdateEnabled(enabled: boolean): void {
  fs.writeFileSync(settingsPath(), JSON.stringify({ autoUpdateEnabled: enabled }), "utf-8");
}
