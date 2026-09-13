import { useEffect, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { MAIN_CHANNEL, type ChannelId } from "@ron-voice/shared";
import { useSessionStore } from "../state/sessionStore";
import { TeamBox } from "../components/TeamBox";
import { SettingsPanel } from "../components/SettingsPanel";

export function LobbyScreen() {
  const roomCode = useSessionStore((s) => s.roomCode);
  const status = useSessionStore((s) => s.status);
  const isHost = useSessionStore((s) => s.isHost);
  const teams = useSessionStore((s) => s.teams);
  const participants = useSessionStore((s) => s.participants);
  const addTeam = useSessionStore((s) => s.addTeam);
  const moveLocalParticipantToChannel = useSessionStore(
    (s) => s.moveLocalParticipantToChannel,
  );
  const leave = useSessionStore((s) => s.leave);

  const [newTeamName, setNewTeamName] = useState("");
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [accelerator, setAccelerator] = useState("");

  useEffect(() => {
    void window.hotkeySettings.get().then(setAccelerator);
  }, [showSettings]);

  function handleDragEnd(event: DragEndEvent) {
    const targetChannel = event.over?.id as ChannelId | undefined;
    if (targetChannel) {
      void moveLocalParticipantToChannel(targetChannel);
    }
  }

  function handleAddTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;
    void addTeam(name);
    setNewTeamName("");
    setShowAddTeamForm(false);
  }

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <main>
      <div className="lobby-header">
        <h1>RoN Voice Chat</h1>
        <button type="button" onClick={() => setShowSettings(true)}>
          Settings
        </button>
      </div>
      <p id="status">
        Room: <strong>{roomCode}</strong> &mdash; {status}
      </p>
      <p className="hint">
        Press {accelerator || "F1"} to toggle between Main and your last team.
      </p>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="team-box-grid">
          <TeamBox
            channelId={MAIN_CHANNEL}
            name="Main"
            participants={participants.filter((p) => p.channel === MAIN_CHANNEL)}
          />
          {teams.map((team) => (
            <TeamBox
              key={team.id}
              channelId={team.id}
              name={team.name}
              participants={participants.filter((p) => p.channel === team.id)}
            />
          ))}
        </div>
      </DndContext>

      {isHost && (
        <div className="add-team-section">
          {showAddTeamForm ? (
            <form onSubmit={handleAddTeamSubmit} className="button-row">
              <input
                type="text"
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                autoFocus
              />
              <button type="submit">Create</button>
              <button type="button" onClick={() => setShowAddTeamForm(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setShowAddTeamForm(true)}>
              + Add Team
            </button>
          )}
        </div>
      )}

      <div className="button-row leave-row">
        <button type="button" onClick={leave}>
          Leave
        </button>
      </div>
    </main>
  );
}
