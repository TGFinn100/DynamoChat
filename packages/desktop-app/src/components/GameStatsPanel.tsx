import { useEffect, useMemo, useState } from "react";
import type { StatsGameInfo, MissionStatDto } from "../lib/statsChannel";

interface Props {
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface MissionGroup {
  levelId: string;
  levelLabel: string;
  /** Sorted hardest-first; [0] is the default shown row. */
  runs: MissionStatDto[];
}

function groupByLevel(missions: MissionStatDto[]): MissionGroup[] {
  const byLevel = new Map<string, MissionStatDto[]>();
  for (const m of missions) {
    const list = byLevel.get(m.levelId) ?? [];
    list.push(m);
    byLevel.set(m.levelId, list);
  }
  return Array.from(byLevel.entries()).map(([levelId, runs]) => ({
    levelId,
    levelLabel: runs[0].levelLabel,
    runs: [...runs].sort((a, b) => b.difficultyRank - a.difficultyRank),
  }));
}

function MissionRow({ group }: { group: MissionGroup }) {
  const [selectedTag, setSelectedTag] = useState(group.runs[0].difficultyTag);
  const selected = group.runs.find((r) => r.difficultyTag === selectedTag) ?? group.runs[0];

  return (
    <tr>
      <td>{group.levelLabel}</td>
      <td>
        {group.runs.length > 1 ? (
          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            {group.runs.map((r) => (
              <option key={r.difficultyTag} value={r.difficultyTag}>
                {r.difficultyLabel}
              </option>
            ))}
          </select>
        ) : (
          selected.difficultyLabel
        )}
      </td>
      <td>
        {Math.round(selected.bestRating * 100)}% ({selected.rankLetter})
      </td>
      <td>{formatTime(selected.bestTimeSeconds)}</td>
      <td>{selected.timesCompleted}</td>
    </tr>
  );
}

export function GameStatsPanel({ onClose }: Props) {
  const [games, setGames] = useState<StatsGameInfo[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionStatDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void window.gameStats.listGames().then((list) => {
      setGames(list);
      // Auto-detect: default to whichever supported game is currently running.
      const running = list.find((g) => g.running);
      setSelectedGameId(running?.id ?? list[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedGameId) return;
    setLoading(true);
    setError(null);
    void window.gameStats.getStats(selectedGameId).then((result) => {
      setLoading(false);
      if (result.success) {
        setMissions(result.missions ?? []);
      } else {
        setMissions(null);
        setError(result.error ?? "Couldn't load stats.");
      }
    });
  }, [selectedGameId]);

  const groups = useMemo(() => (missions ? groupByLevel(missions) : []), [missions]);

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <h2>Game Stats</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <section>
        <label>
          Game
          <select
            value={selectedGameId ?? ""}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            {games.length === 0 && <option value="">No supported games</option>}
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.displayName}
                {g.running ? " (running)" : !g.installed ? " (not installed)" : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="settings-hint">
          Each mission shows its hardest difficulty played by default - use the dropdown in that
          row to check an earlier/easier run. Most mission names are confirmed official titles;
          any still showing a plain location name (e.g. "Boat") couldn't be confirmed. Rank
          letters: S/A+/A/B were confirmed against the in-game display; C/D and the E/F boundary
          are inferred from an even 10-point scale, not individually confirmed.
        </p>
      </section>

      {loading && <p className="settings-hint">Loading...</p>}
      {error && <p className="settings-error">{error}</p>}

      {groups.length === 0 && !loading && !error && (
        <p className="settings-hint">No missions completed yet.</p>
      )}

      {groups.length > 0 && (
        <table className="stats-table">
          <thead>
            <tr>
              <th>Mission</th>
              <th>Difficulty</th>
              <th>Best Rating</th>
              <th>Best Time</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <MissionRow key={group.levelId} group={group} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
