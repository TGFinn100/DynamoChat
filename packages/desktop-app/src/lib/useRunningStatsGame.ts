import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5000;

// Drives the "Game Stats" nav button's label - shows which supported game is
// currently running, if any, so the button reads e.g. "Ready or Not Stats"
// instead of the generic default.
export function useRunningStatsGameName(): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const games = await window.gameStats.listGames();
      if (cancelled) return;
      const running = games.find((g) => g.running);
      setName(running?.displayName ?? null);
    }

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return name;
}
