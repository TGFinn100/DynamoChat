import { useSessionStore } from "./state/sessionStore";
import { JoinScreen } from "./screens/JoinScreen";
import { LobbyScreen } from "./screens/LobbyScreen";

export function App() {
  const screen = useSessionStore((s) => s.screen);
  return screen === "lobby" ? <LobbyScreen /> : <JoinScreen />;
}
