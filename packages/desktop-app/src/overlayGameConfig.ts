import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import {
  SUPPORTED_OVERLAY_GAMES,
  type OverlayGameStatus,
  type SetWindowedFullscreenResult,
} from "./lib/overlayGameChannel";

// Standard Unreal Engine convention: 0 = exclusive Fullscreen, 1 = Windowed
// Fullscreen (borderless), 2 = Windowed. Verified against Finn's own
// Ready or Not install; not guaranteed for every game in the registry.
const WINDOWED_FULLSCREEN_VALUE = 1;
const FULLSCREEN_KEYS = ["FullscreenMode", "PreferredFullscreenMode", "LastConfirmedFullscreenMode"];

function localAppDataDir(): string {
  return process.env.LOCALAPPDATA ?? path.join(app.getPath("home"), "AppData", "Local");
}

function findGame(gameId: string) {
  return SUPPORTED_OVERLAY_GAMES.find((g) => g.id === gameId);
}

function configFilePath(gameId: string): string | null {
  const game = findGame(gameId);
  if (!game) return null;
  return path.join(localAppDataDir(), game.configPathFromLocalAppData);
}

function readFullscreenModeValue(iniText: string): number | null {
  const match = iniText.match(/^FullscreenMode=(\d+)\s*$/m);
  return match ? parseInt(match[1], 10) : null;
}

function replaceIniValue(text: string, key: string, value: number): string {
  const pattern = new RegExp(`^${key}=\\d+\\s*$`, "m");
  return pattern.test(text) ? text.replace(pattern, `${key}=${value}`) : text;
}

// Tracks the value each game's FullscreenMode was set to before we switched
// it to Windowed Fullscreen, so turning the toggle back off restores what the
// player actually had - not a hardcoded guess.
function restoreValuesPath(): string {
  return path.join(app.getPath("userData"), "overlay-game-restore-values.json");
}

function loadRestoreValues(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(restoreValuesPath(), "utf-8")) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveRestoreValues(values: Record<string, number>): void {
  fs.writeFileSync(restoreValuesPath(), JSON.stringify(values), "utf-8");
}

export function getOverlayGameStatus(gameId: string): OverlayGameStatus | null {
  const game = findGame(gameId);
  if (!game) return null;

  const filePath = configFilePath(gameId);
  if (!filePath || !fs.existsSync(filePath)) {
    return { id: game.id, displayName: game.displayName, status: "not-installed", windowedFullscreenEnabled: null };
  }

  try {
    const value = readFullscreenModeValue(fs.readFileSync(filePath, "utf-8"));
    return {
      id: game.id,
      displayName: game.displayName,
      status: "installed",
      windowedFullscreenEnabled: value === null ? null : value === WINDOWED_FULLSCREEN_VALUE,
    };
  } catch {
    return { id: game.id, displayName: game.displayName, status: "installed", windowedFullscreenEnabled: null };
  }
}

export function getAllOverlayGameStatuses(): OverlayGameStatus[] {
  return SUPPORTED_OVERLAY_GAMES.map((g) => getOverlayGameStatus(g.id)).filter(
    (s): s is OverlayGameStatus => s !== null,
  );
}

export function setWindowedFullscreen(gameId: string, enabled: boolean): SetWindowedFullscreenResult {
  const filePath = configFilePath(gameId);
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, error: "That game's config file wasn't found - is it installed?" };
  }

  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    return { success: false, error: `Could not read the game's settings file: ${(err as Error).message}` };
  }

  const currentValue = readFullscreenModeValue(text);
  if (currentValue === null) {
    return { success: false, error: "Could not find a FullscreenMode setting in the game's config file." };
  }

  const restoreValues = loadRestoreValues();
  let newValue: number;
  if (enabled) {
    if (currentValue !== WINDOWED_FULLSCREEN_VALUE) {
      restoreValues[gameId] = currentValue;
      saveRestoreValues(restoreValues);
    }
    newValue = WINDOWED_FULLSCREEN_VALUE;
  } else {
    newValue = restoreValues[gameId] ?? 0;
    delete restoreValues[gameId];
    saveRestoreValues(restoreValues);
  }

  // One-time safety net before we ever touch this file for this game.
  const backupPath = `${filePath}.dynamochat-backup`;
  if (!fs.existsSync(backupPath)) {
    try {
      fs.copyFileSync(filePath, backupPath);
    } catch {
      // Non-fatal - proceed without a backup rather than blocking the toggle.
    }
  }

  let updated = text;
  for (const key of FULLSCREEN_KEYS) {
    updated = replaceIniValue(updated, key, newValue);
  }

  try {
    fs.writeFileSync(filePath, updated, "utf-8");
  } catch (err) {
    return { success: false, error: `Could not write the game's settings file: ${(err as Error).message}` };
  }

  return { success: true };
}
