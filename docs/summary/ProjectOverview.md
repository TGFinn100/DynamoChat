# Project Overview

## Current state

DynamoChat (GitHub repo name and in-app product name as of v0.7.0 — rebranded from "RoN Voice Chat") is a custom Electron desktop voice-chat app for Finn's Ready or Not friend group. Phases 0-7 of the original build plan are complete and verified, plus a substantial round of post-v1 game-integration features — see [Game Integration](GameIntegration.md).

## History

- **Concept**: one mandatory "Main" broadcast channel everyone always hears, plus any number of flexible "Team" channels created ad hoc. Default state is Main. A single hotkey toggles between Main and whichever team you were last on — this was explicitly simplified from an initial per-team-hotkey design.
- **Audio model**: while on a team, you hear Main + that team, never other teams, and Main can never be muted. Team assignment is self-service via drag-and-drop in a lobby screen (not host-assigned).
- **Originally deferred as out of scope for v1**, both now revisited: a true fullscreen-exclusive visual overlay was built in v0.7.0 (not via graphics-API hooking as originally assumed necessary — see [Game Integration](GameIntegration.md) for the anti-cheat-safe approach actually used). Ready or Not game-state integration (auto-detecting in-game squads) remains unstarted; what v0.7.0 added instead is reading the game's own save-file stats, a related but different thing.
- **Rebrand** (v0.7.0): in-app name and window title changed from "RoN Voice Chat" to "Dynamo Chat" to match the GitHub repo name, which was always DynamoChat. Electron's `productName` drives the userData folder location, so this required migrating `%APPDATA%\RoN Voice Chat` to `%APPDATA%\Dynamo Chat` to preserve Finn's saved settings/theme — see [Deployment And Distribution](DeploymentAndDistribution.md).
- **Tech stack decisions**: Electron (chosen over Tauri for ecosystem maturity around global shortcuts/audio), LiveKit Cloud free tier for voice, a small Node/Express backend on Render's free tier for room codes + token minting, GitHub (`TGFinn100/DynamoChat`, public) for source + release hosting.
- Full original architecture/build plan preserved at `C:\Users\DalyF\.claude\plans\sequential-drifting-goose.md`.

## Open questions

None on the original v1 concept. Ready or Not squad auto-detection remains an unstarted stretch goal. See [Game Integration](GameIntegration.md) for open items on the newer overlay/stats/theme work.
