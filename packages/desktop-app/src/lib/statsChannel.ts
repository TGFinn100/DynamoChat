export const STATS_GAMES_LIST = "stats:games-list";
export const STATS_GET_FOR_GAME = "stats:get-for-game";

export interface StatsGameInfo {
  id: string;
  displayName: string;
  /** True if this game's save file was found on disk (mission list may still be empty if nothing's been played). */
  installed: boolean;
  /** True if the game's process is currently running - used to auto-select it in the dropdown. */
  running: boolean;
}

export interface MissionStatDto {
  levelId: string;
  levelLabel: string;
  difficultyTag: string;
  difficultyLabel: string;
  /** Higher = harder (Hard=2, Standard=1, Casual=0), for picking/sorting the default row per map. */
  difficultyRank: number;
  bestRating: number;
  /** Some boundaries confirmed in-game, some inferred - see readyOrNotStats.ts's rankLetter(). */
  rankLetter: string;
  bestTimeSeconds: number;
  timesCompleted: number;
}

export interface GetStatsResult {
  success: boolean;
  missions?: MissionStatDto[];
  error?: string;
}
