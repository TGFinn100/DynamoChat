import type { SetHotkeyResult } from "./lib/hotkeyChannel";
import type { UpdateStatus } from "./lib/updateChannel";
import type { OverlayGameStatus, SetWindowedFullscreenResult } from "./lib/overlayGameChannel";
import type { OverlayData } from "./lib/overlayDataChannel";
import type { StatsGameInfo, GetStatsResult } from "./lib/statsChannel";

declare global {
  interface Window {
    hotkeys: {
      onToggleMain: (callback: () => void) => () => void;
    };
    hotkeySettings: {
      get: () => Promise<string>;
      set: (accelerator: string) => Promise<SetHotkeyResult>;
    };
    deepLink: {
      onJoinRoom: (callback: (roomCode: string) => void) => () => void;
    };
    updateStatus: {
      onStatusChange: (callback: (status: UpdateStatus) => void) => () => void;
      restartNow: () => void;
      checkNow: () => void;
      getAutoUpdateEnabled: () => Promise<boolean>;
      setAutoUpdateEnabled: (enabled: boolean) => void;
    };
    appInfo: {
      getVersion: () => Promise<string>;
    };
    overlayGames: {
      getStatuses: () => Promise<OverlayGameStatus[]>;
      setWindowedFullscreen: (gameId: string, enabled: boolean) => Promise<SetWindowedFullscreenResult>;
    };
    overlayData: {
      update: (data: OverlayData) => void;
    };
    gameStats: {
      listGames: () => Promise<StatsGameInfo[]>;
      getStats: (gameId: string) => Promise<GetStatsResult>;
    };
    gamesRunning: {
      list: () => Promise<string[]>;
    };
  }
}

export {};
