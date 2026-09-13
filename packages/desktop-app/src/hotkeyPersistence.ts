import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { TOGGLE_MAIN_ACCELERATOR } from "./lib/hotkeyChannel";

function settingsPath(): string {
  return path.join(app.getPath("userData"), "hotkey-settings.json");
}

export function loadAccelerator(): string {
  try {
    const raw = fs.readFileSync(settingsPath(), "utf-8");
    const parsed = JSON.parse(raw) as { accelerator?: unknown };
    if (typeof parsed.accelerator === "string" && parsed.accelerator.length > 0) {
      return parsed.accelerator;
    }
  } catch {
    // No saved settings yet, or the file is corrupt - fall back to the default.
  }
  return TOGGLE_MAIN_ACCELERATOR;
}

export function saveAccelerator(accelerator: string): void {
  fs.writeFileSync(settingsPath(), JSON.stringify({ accelerator }), "utf-8");
}
