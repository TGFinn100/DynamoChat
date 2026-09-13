import { useEffect, useState } from "react";
import type { OverlayGameStatus } from "../lib/overlayGameChannel";

export function OverlaySettings() {
  const [games, setGames] = useState<OverlayGameStatus[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void window.overlayGames.getStatuses().then(setGames);
  }, []);

  async function handleToggle(gameId: string, enabled: boolean) {
    setPendingId(gameId);
    setError(null);
    const result = await window.overlayGames.setWindowedFullscreen(gameId, enabled);
    if (result.success) {
      setGames(await window.overlayGames.getStatuses());
    } else {
      setError(result.error ?? "Could not update that game's settings.");
    }
    setPendingId(null);
  }

  return (
    <section>
      <h3>Overlay Compatibility</h3>
      <p className="settings-hint">
        Switches a game's own display setting to Windowed Fullscreen (borderless), which is
        required for an on-screen overlay to render on top of it. Off by default - close the
        game before toggling, since it may overwrite the change when you exit.
      </p>
      {games.length === 0 && <p className="settings-hint">No supported games detected.</p>}
      {games.map((game) => (
        <div className="overlay-game-row" key={game.id}>
          <span>{game.displayName}</span>
          {game.status === "not-installed" ? (
            <span className="settings-hint">Not installed</span>
          ) : game.windowedFullscreenEnabled === null ? (
            <span className="settings-hint">Couldn't read its settings</span>
          ) : (
            <label>
              <input
                type="checkbox"
                checked={game.windowedFullscreenEnabled}
                disabled={pendingId === game.id}
                onChange={(e) => void handleToggle(game.id, e.target.checked)}
              />
              Windowed Fullscreen
            </label>
          )}
        </div>
      ))}
      {error && <p className="settings-error">{error}</p>}
    </section>
  );
}
