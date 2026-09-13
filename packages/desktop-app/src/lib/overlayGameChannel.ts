// Registry of games we know how to switch into Windowed Fullscreen (borderless)
// for overlay compatibility - see docs/summary/Architecture.md. Only Unreal
// Engine games whose GameUserSettings.ini path and FullscreenMode convention
// we've actually verified belong here; a game "probably" working isn't enough
// given we're rewriting another app's config file.
export interface SupportedOverlayGame {
  id: string;
  displayName: string;
  /** Path to GameUserSettings.ini, relative to %LOCALAPPDATA%. Windows only. */
  configPathFromLocalAppData: string;
  /** Image name of the actual gameplay process, as `tasklist` reports it - used to show/hide the overlay only while the game is running, and to auto-select the running game in the stats dropdown. */
  processName: string;
  /** Path to the save file holding per-mission stats, relative to %LOCALAPPDATA% - omitted for games we haven't written a stats parser for. */
  statsSavePathFromLocalAppData?: string;
  /** Name of a theme in lib/theme.ts's PRESET_THEMES to auto-apply while this game is running - omitted for games without a matching theme. */
  themeName?: string;
}

export const SUPPORTED_OVERLAY_GAMES: SupportedOverlayGame[] = [
  {
    id: "ready-or-not",
    displayName: "Ready or Not",
    configPathFromLocalAppData: "ReadyOrNot/Saved/Config/Windows/GameUserSettings.ini",
    processName: "ReadyOrNotSteam-Win64-Shipping.exe",
    statsSavePathFromLocalAppData: "ReadyOrNot/Saved/SaveGames/LevelStats.sav",
    themeName: "Ready or Not",
  },
];

export const OVERLAY_GAMES_STATUS_GET = "overlay-games:status-get";
export const OVERLAY_GAME_SET_WINDOWED = "overlay-games:set-windowed";

export type OverlayGameInstallStatus = "installed" | "not-installed";

export interface OverlayGameStatus {
  id: string;
  displayName: string;
  status: OverlayGameInstallStatus;
  /** null when not installed, or the setting couldn't be found/parsed. */
  windowedFullscreenEnabled: boolean | null;
}

export interface SetWindowedFullscreenResult {
  success: boolean;
  error?: string;
}
