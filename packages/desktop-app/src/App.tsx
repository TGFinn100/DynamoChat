import { useEffect } from "react";
import { useSessionStore } from "./state/sessionStore";
import { JoinScreen } from "./screens/JoinScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { UpdateBanner } from "./components/UpdateBanner";
import { SettingsPanel } from "./components/SettingsPanel";
import { GameStatsPanel } from "./components/GameStatsPanel";
import { AppVersion } from "./components/AppVersion";
import { reapplyEffectiveTheme, useAutoGameTheme } from "./lib/useAutoGameTheme";
import { startOverlayDataBridge } from "./lib/overlayDataBridge";

export function App() {
  const screen = useSessionStore((s) => s.screen);
  const setRoomCode = useSessionStore((s) => s.setRoomCode);
  const showSettings = useSessionStore((s) => s.showSettings);
  const setShowSettings = useSessionStore((s) => s.setShowSettings);
  const showStats = useSessionStore((s) => s.showStats);
  const setShowStats = useSessionStore((s) => s.setShowStats);

  useEffect(() => {
    return window.deepLink.onJoinRoom((roomCode) => {
      setRoomCode(roomCode);
    });
  }, [setRoomCode]);

  useEffect(() => {
    reapplyEffectiveTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", reapplyEffectiveTheme);
    return () => media.removeEventListener("change", reapplyEffectiveTheme);
  }, []);

  useAutoGameTheme();

  useEffect(() => startOverlayDataBridge(), []);

  return (
    <>
      <UpdateBanner />
      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : showStats ? (
        <GameStatsPanel onClose={() => setShowStats(false)} />
      ) : screen === "lobby" ? (
        <LobbyScreen />
      ) : (
        <JoinScreen />
      )}
      <AppVersion />
    </>
  );
}
