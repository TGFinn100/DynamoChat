import { useEffect } from "react";
import { applyTheme, getActiveTheme, getAllThemes, getAutoThemeSwitchEnabled } from "./theme";
import { SUPPORTED_OVERLAY_GAMES } from "./overlayGameChannel";

const POLL_INTERVAL_MS = 5000;

// Which game's theme (if any) is currently overriding the user's normal
// theme. Module-level rather than component state so App's OS dark/light
// listener can check it too via reapplyEffectiveTheme() - otherwise an OS
// theme flip while a game theme is active would fight this hook's override
// until the next poll corrected it.
let activeGameThemeName: string | null = null;

export function reapplyEffectiveTheme(): void {
  if (activeGameThemeName) {
    const gameTheme = getAllThemes().find((t) => t.name === activeGameThemeName);
    if (gameTheme) {
      applyTheme(gameTheme);
      return;
    }
  }
  applyTheme(getActiveTheme());
}

// Auto-switches to a game's theme while it's running, gated behind the
// "auto-switch theme" setting (off by default - see ThemeSettings.tsx).
// Never persists the override as the user's chosen theme - it's a purely
// visual overlay on top of their real preference, reverting automatically
// when the game closes.
export function useAutoGameTheme(): void {
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (!getAutoThemeSwitchEnabled()) {
        if (activeGameThemeName) {
          activeGameThemeName = null;
          reapplyEffectiveTheme();
        }
        return;
      }

      const runningIds = await window.gamesRunning.list();
      if (cancelled) return;

      const match = SUPPORTED_OVERLAY_GAMES.find((g) => g.themeName && runningIds.includes(g.id));
      const nextThemeName = match?.themeName ?? null;

      if (nextThemeName !== activeGameThemeName) {
        activeGameThemeName = nextThemeName;
        reapplyEffectiveTheme();
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
