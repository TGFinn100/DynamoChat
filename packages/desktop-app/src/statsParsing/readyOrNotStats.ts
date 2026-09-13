import { parseGvasProperties, findProperty, type GvasProperty, type GvasStructValue, type GvasMapValue } from "./gvasReader";

export interface MissionStat {
  levelId: string;
  /** Raw GameplayTag, e.g. "Difficulty.Standard.Hard" - not yet cleaned up for display. */
  difficultyTag: string;
  /** Raw 0-1(ish) score from the save file. We haven't calibrated this against the in-game S/A/B/C/D letter rank, so it's surfaced as-is rather than guessed. */
  bestRating: number;
  bestTimeSeconds: number;
  timesCompleted: number;
}

function asStruct(value: unknown): GvasStructValue | null {
  return value && typeof value === "object" && "fields" in value ? (value as GvasStructValue) : null;
}

function asMap(value: unknown): GvasMapValue | null {
  return value && typeof value === "object" && "entries" in value ? (value as GvasMapValue) : null;
}

export function parseLevelStats(buffer: Buffer): MissionStat[] {
  const top: GvasProperty[] = parseGvasProperties(buffer);
  const levelMap = asMap(findProperty(top, "LevelStatsDifficultyMap")?.value);
  if (!levelMap) return [];

  const results: MissionStat[] = [];

  for (const entry of levelMap.entries) {
    const levelId = typeof entry.key === "string" ? entry.key : null;
    const levelStruct = asStruct(entry.value);
    if (!levelId || !levelStruct) continue;

    const forDifficulty = asMap(findProperty(levelStruct.fields, "LevelStatsForDifficulty")?.value);
    if (!forDifficulty) continue;

    for (const diffEntry of forDifficulty.entries) {
      const tagStruct = asStruct(diffEntry.key);
      const statStruct = asStruct(diffEntry.value);
      if (!tagStruct || !statStruct) continue;

      const difficultyTag = findProperty(tagStruct.fields, "TagName")?.value;
      const bestRating = findProperty(statStruct.fields, "BestRating")?.value;
      const bestTime = findProperty(statStruct.fields, "BestTime")?.value;
      const timesCompleted = findProperty(statStruct.fields, "TimesCompleted")?.value;

      results.push({
        levelId,
        difficultyTag: typeof difficultyTag === "string" ? difficultyTag : "Unknown",
        bestRating: typeof bestRating === "number" ? bestRating : 0,
        bestTimeSeconds: typeof bestTime === "number" ? bestTime : 0,
        timesCompleted: typeof timesCompleted === "number" ? timesCompleted : 0,
      });
    }
  }

  return results;
}

// Internal level id -> official in-game mission title, confirmed by matching
// each mission's setting on the Ready or Not wiki against what the level id
// describes (e.g. "ron_penthouse_..." -> the Clemente Hotel penthouse suite
// in "Sins of the Father"). Deliberately incomplete: "boat" is left out
// because the closest setting match (Mirage at Sea) is DLC content we
// couldn't confirm is the same mission - better to fall back to the
// humanized id than assert a guess as fact.
const KNOWN_LEVEL_TITLES: Record<string, string> = {
  ron_campus_barricadedsuspects_core: "Elephant",
  ron_gas_barricadedsuspects_core: "Thank You, Come Again",
  ron_datacenter_barricadedsuspects_core: "Sinuous Trail",
  ron_streamer_barricadedsuspects_core: "23 Megabytes a Second",
  ron_agency_barricadedsuspects_core: "The Spider",
  ron_beachfront_barricadedsuspects_core: "Ends of the Earth",
  ron_club_barricadedsuspects_core: "Neon Tomb",
  ron_penthouse_barricadedsuspects_core: "Sins of the Father",
};

// Falls back to cleaning up the internal id when we don't have a confirmed
// official title - not guaranteed to match what Ready or Not itself calls it.
export function humanizeLevelId(levelId: string): string {
  const known = KNOWN_LEVEL_TITLES[levelId];
  if (known) return known;

  const withoutPrefix = levelId.replace(/^ron_/, "");
  const withoutSuffix = withoutPrefix.replace(/_barricadedsuspects_core$|_core$/, "");
  return withoutSuffix
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// e.g. "Difficulty.Standard.Hard" -> "Hard"
export function humanizeDifficultyTag(tag: string): string {
  const parts = tag.split(".");
  return parts[parts.length - 1] || tag;
}

// Higher = harder. Unrecognized tags sort lowest rather than crashing.
export function difficultyRank(tag: string): number {
  switch (humanizeDifficultyTag(tag).toLowerCase()) {
    case "hard":
      return 2;
    case "standard":
      return 1;
    case "casual":
      return 0;
    default:
      return -1;
  }
}

// TODO: C, D, and the E/F boundary are still unconfirmed - see below. Must
// be verified in-game (check a mission whose rating falls in the 60-79%
// range, and one below 50%) and this function updated before treating those
// letters as reliable.
//
// Ready or Not's grading system is percentage-based (Earned/Potential
// points), scale S/A+/A/B/C/D/E/F (confirmed via the game's own
// ProgressionTags save data, which records "<level>_grade_<tier>" for every
// tier reached). Boundary confirmation status:
//   S=100%, A+=95%, A=90%, B=80% - confirmed directly by Finn in-game.
//   E=50-59% - confirmed by two in-game checks (Sinuous Trail 57.17%,
//     23 Megabytes a Second 54.12%, both showed E).
//   C, D, and the E/F boundary are NOT confirmed - inferred by assuming
//   evenly-spaced 10-point bands below B, which is consistent with every
//   confirmed data point above but hasn't been checked directly.
export function rankLetter(bestRating: number): string {
  const pct = bestRating * 100;
  if (pct >= 100) return "S";
  if (pct >= 95) return "A+";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  if (pct >= 50) return "E";
  return "F";
}
