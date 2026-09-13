# Implementation Status

## Current state

All 7 phases of the original build plan are implemented and verified (locally and/or against the live deployed backend). Current desktop-app version: v0.3.0 (published, currently running a deliberately loud purple/blue test theme — see [Deployment And Distribution](DeploymentAndDistribution.md)).

## History

Verified with real multi-client testing, phase by phase:

- **Backend**: `/rooms` (generates + registers a code), `/token` (mints a scoped LiveKit JWT, rejects unregistered codes with a clear error instead of silently creating an empty room).
- **Lobby UI**: React + Zustand + `@dnd-kit`. Drag your own tile into a team box to self-assign; host can add teams (broadcast via LiveKit data messages, synced to late joiners).
- **Audio routing**: see [Architecture](Architecture.md) for the design; verified with 3 real clients that Main is always heard and teams stay isolated from each other.
- **Hotkey**: single **F1** (remappable, see Settings below) toggles Main ⇄ your last team. Verified working with Ready or Not running in actual exclusive fullscreen, no conflicts with the game.
- **Audio cue**: synthesized (not a sound file) two-note Web Audio chirp on every successful switch — rising into a team, falling back to Main.
- **Reliability**: reconnection handling (re-asserts channel + resubscribes after a dropped connection resumes), cold-start retry with a "waking up the server" status (Render's free tier sleeps after 15 min idle), distinct error messages for bad room code / mic permission denied / backend unreachable.
- **Settings panel** (in the lobby): hotkey can be rebound to any key/combo (captured via a keydown listener, persisted to a JSON file in Electron's userData by the main process, since re-registering `globalShortcut` has to happen there); microphone and output device pickers (LiveKit's device list, applied via `switchActiveDevice`, persisted in localStorage, also drives the audio cue's output via `setSinkId`).
- **Light/dark theming**: CSS custom properties following `prefers-color-scheme` automatically (Electron's `nativeTheme` defaults to "system") — no manual toggle built, none requested.

## Open questions

- The loud purple/blue v0.3.0 test theme needs reverting to a real palette once the auto-update test (see [Deployment And Distribution](DeploymentAndDistribution.md)) is confirmed working — deliberately left as-is so a future update stays visually obvious to test against.
