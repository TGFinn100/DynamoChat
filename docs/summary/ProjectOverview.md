# Project Overview

## Current state

DynamoChat (GitHub repo name; in-app product name "RoN Voice Chat") is a custom Electron desktop voice-chat app for Finn's Ready or Not friend group. Phases 0-7 of the original build plan are complete and verified.

## History

- **Concept**: one mandatory "Main" broadcast channel everyone always hears, plus any number of flexible "Team" channels created ad hoc. Default state is Main. A single hotkey toggles between Main and whichever team you were last on — this was explicitly simplified from an initial per-team-hotkey design.
- **Audio model**: while on a team, you hear Main + that team, never other teams, and Main can never be muted. Team assignment is self-service via drag-and-drop in a lobby screen (not host-assigned).
- **Explicitly out of scope for v1** (deliberate call made early on): a true fullscreen-exclusive visual overlay (needs graphics-API hooking — a much bigger effort than the audio cue built instead) and Ready or Not game-state integration (unresearched stretch goal, e.g. auto-detecting in-game squads).
- **Tech stack decisions**: Electron (chosen over Tauri for ecosystem maturity around global shortcuts/audio), LiveKit Cloud free tier for voice, a small Node/Express backend on Render's free tier for room codes + token minting, GitHub (`TGFinn100/DynamoChat`, public) for source + release hosting.
- Full original architecture/build plan preserved at `C:\Users\DalyF\.claude\plans\sequential-drifting-goose.md`.

## Open questions

None on the concept — v1 is fully built, deployed, and distributing itself via auto-update. The two explicitly-deferred stretch goals (fullscreen overlay, Ready or Not game-state integration) remain unstarted if picked up later.
