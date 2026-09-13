import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { SUPPORTED_OVERLAY_GAMES, type SupportedOverlayGame } from "./lib/overlayGameChannel";
import type { GetStatsResult, MissionStatDto, StatsGameInfo } from "./lib/statsChannel";
import { isProcessRunning } from "./processCheck";
import {
  parseLevelStats,
  humanizeLevelId,
  humanizeDifficultyTag,
  difficultyRank,
  rankLetter,
} from "./statsParsing/readyOrNotStats";

function localAppDataDir(): string {
  return process.env.LOCALAPPDATA ?? path.join(app.getPath("home"), "AppData", "Local");
}

// Games we know how to both find AND parse a stats save for. Only
// "ready-or-not" so far - a new game needs its own parser (each game's save
// format/property layout differs), registered here by id.
const STATS_PARSERS: Record<string, (buffer: Buffer) => MissionStatDto[]> = {
  "ready-or-not": (buffer) =>
    parseLevelStats(buffer).map((m) => ({
      levelId: m.levelId,
      levelLabel: humanizeLevelId(m.levelId),
      difficultyTag: m.difficultyTag,
      difficultyLabel: humanizeDifficultyTag(m.difficultyTag),
      difficultyRank: difficultyRank(m.difficultyTag),
      bestRating: m.bestRating,
      rankLetter: rankLetter(m.bestRating),
      bestTimeSeconds: m.bestTimeSeconds,
      timesCompleted: m.timesCompleted,
    })),
};

type GameWithStatsSupport = SupportedOverlayGame & { statsSavePathFromLocalAppData: string };

function statsGamesWithSupport(): GameWithStatsSupport[] {
  return SUPPORTED_OVERLAY_GAMES.filter(
    (g): g is GameWithStatsSupport => Boolean(g.statsSavePathFromLocalAppData) && Boolean(STATS_PARSERS[g.id]),
  );
}

export async function listStatsGames(): Promise<StatsGameInfo[]> {
  const games = statsGamesWithSupport();
  const results: StatsGameInfo[] = [];
  for (const game of games) {
    const savePath = path.join(localAppDataDir(), game.statsSavePathFromLocalAppData);
    const running = await isProcessRunning(game.processName);
    results.push({
      id: game.id,
      displayName: game.displayName,
      installed: fs.existsSync(savePath),
      running,
    });
  }
  return results;
}

export function getStatsForGame(gameId: string): GetStatsResult {
  const game = statsGamesWithSupport().find((g) => g.id === gameId);
  if (!game) {
    return { success: false, error: "This game isn't supported for stats yet." };
  }

  const savePath = path.join(localAppDataDir(), game.statsSavePathFromLocalAppData);
  if (!fs.existsSync(savePath)) {
    return { success: false, error: "No save data found - has anything been played yet?" };
  }

  try {
    const buffer = fs.readFileSync(savePath);
    const missions = STATS_PARSERS[game.id](buffer);
    return { success: true, missions };
  } catch (err) {
    return { success: false, error: `Couldn't read this game's stats file: ${(err as Error).message}` };
  }
}
