# Game Integration

## Current state

Three features, all shipped in v0.7.0, sharing one mechanism: detecting whether a supported game is currently running (`processCheck.ts`'s `isProcessRunning`, polling Windows' `tasklist`). Only Ready or Not is registered so far, in a single per-game registry (`lib/overlayGameChannel.ts`'s `SUPPORTED_OVERLAY_GAMES` - id, display name, process name, config-file path, stats-save path, theme name).

- **In-game overlay**: a transparent, click-through, always-on-top window showing your current channel and a live roster (name, channel, speaking indicator), visible only while Ready or Not is running.
- **Game Stats panel**: an in-app (not overlay) screen showing real per-mission completion data read from the game's own save file, with a game-picker dropdown that auto-selects whichever supported game is running.
- **Theme auto-switch**: an opt-in Settings toggle that applies a game-specific theme while that game is running, reverting automatically when it closes.

## History

### Overlay

- Explicitly **not** built via DirectX/graphics-API hooking (the original v1 plan's assumption for what a "fullscreen overlay" would require) - that technique is indistinguishable, from an anti-cheat driver's point of view, from what a cheat's ESP overlay does, and EAC is reportedly coming to Ready or Not. Discord/Steam/OBS's overlays use the exact same hooking technique but are explicitly allowlisted by anti-cheat vendors by binary signature; a new unsigned DLL doing the same thing would not be.
- Instead: a plain always-on-top `BrowserWindow` (`setAlwaysOnTop(true, 'screen-saver')`, click-through via `setIgnoreMouseEvents`) - just the OS compositor drawing a window on top, no injection. This only works if the game is **not** in true exclusive fullscreen, since that mode bypasses the compositor entirely.
- This is why the **Windowed Fullscreen settings toggle** exists (`overlayGameConfig.ts`): it rewrites `FullscreenMode`/`PreferredFullscreenMode`/`LastConfirmedFullscreenMode` in the game's `GameUserSettings.ini` (`0`=exclusive, `1`=windowed fullscreen - standard Unreal Engine convention, verified against Finn's real config). Off by default per Finn's explicit "an app shouldn't silently change another app's settings" stance; remembers whatever value was there before the first toggle-on so toggle-off restores the real original, not a hardcoded guess; makes a one-time backup file before ever writing.
- **Bug fixed**: the overlay window has no frame/taskbar entry/tray icon, so when it outlived a closed main window, the process kept running invisibly with nothing to click to close it. Fixed by explicitly closing the overlay when the main window closes.
- Content evolved from a static test badge into a live roster: the main window's renderer subscribes to its own zustand store and pushes `{myChannel, participants[] with speaking}` over IPC to the main process on every change, which injects it into the overlay window's already-loaded page via `webContents.executeJavaScript`, base64-encoding the JSON payload first to sidestep any quote/escaping edge cases with player-supplied display names. "Speaking" comes from LiveKit's real `ActiveSpeakersChanged` event (voice-activity detection), not the pre-existing `audible` flag (which only meant "track subscribed", not "currently talking").
- Show/hide is driven by the shared `isProcessRunning` poll (3s interval) rather than showing constantly, since a frameless floating window with no close affordance would otherwise sit uselessly over the desktop whenever the app is open but the game isn't running.

### Game Stats

- Ready or Not's per-mission stats live in `%LOCALAPPDATA%\ReadyOrNot\Saved\SaveGames\LevelStats.sav`, an Unreal Engine "GVAS" binary save file - not JSON, but not encrypted either; property names/string values appear as readable ASCII within a self-describing binary tag format (name, type, size, then type-specific payload).
- Wrote a from-scratch parser (`statsParsing/gvasReader.ts`) rather than pulling in a library - byte layout was cross-checked against the open-source `gvas` Rust crate (github.com/localcc/gvas) for the header/property-tag structure, then empirically verified against Finn's real save file via a throwaway `tsx` script before wiring in any UI. Deliberately narrow: only the property types this file actually uses (Int/Float/Bool/Str/Name/Struct/Map) are supported, and an unrecognized type throws rather than guessing at its header shape and silently corrupting every byte offset after it.
- **Mission names**: internal level ids (e.g. `ron_penthouse_barricadedsuspects_core`) aren't human titles. Matched 8 of 9 played missions to real official titles by cross-referencing each mission's described setting on the Ready or Not wiki against what the id implies (e.g. the penthouse id matches "Sins of the Father"'s Clemente Hotel penthouse suite; the gas id matches "Thank You, Come Again"'s 4U Gas Station). "Boat" is unresolved - the closest setting match (Dark Waters DLC's "Mirage at Sea", a yacht) couldn't be confirmed as the same mission, so it falls back to the humanized id rather than asserting a guess as fact.
- **Rank letters**: the real scale is **S/A+/A/B/C/D/E/F** (8 tiers, confirmed by finding `MetaGameProfile.sav`'s `ProgressionTags` set, which records `<level>_grade_<tier>` for every tier ever reached). Confirmed boundaries (Finn checked in-game): S=100%, A+=95%, A=90%, B=80%, E=50-59%. **C, D, and the E/F boundary are still unconfirmed** - the code infers them from an even 10-point scale for now, flagged with an explicit `TODO` comment in `readyOrNotStats.ts` right above `rankLetter()`.
- **Entry points** (some missions have multiple insertion points): investigated whether any of the four save files (`LevelStats.sav`, `MetaGameProfile.sav`, `SessionData.sav`, `MissionPresets.sav`) track which one was used - none do (the latter two are essentially empty; `MetaGameProfile.sav` is mostly weapon loadout presets). Dropped as not worth building a static reference-only version instead.
- UI groups stats by mission, showing the hardest difficulty played by default with a per-row dropdown to check other difficulty attempts, rather than one row per difficulty.

### Theme auto-switch

- Added a "Ready or Not" preset theme - first pass was a stylistic guess (olive/black/amber, "tactical SWAT" vibe); replaced once Finn shared the actual key art with colors eyeballed from that image instead (near-black background, vivid red accent, off-white text) - not sampled with a color picker, but grounded in the real asset rather than invented.
- Settings toggle (off by default) applies the running game's theme purely as a transient visual override via `applyTheme()` - it never calls `setActiveThemeName()`, so the user's actual saved preference is untouched and a simple `applyTheme(getActiveTheme())` on revert always restores the real, current preference (including any manual theme change made while the override was active).
- Centralized "which theme should currently be showing" into one exported resolver (`reapplyEffectiveTheme()` in `useAutoGameTheme.ts`) called both by the game-detection poll and by `App.tsx`'s OS dark/light-mode-change listener - otherwise the two could fight each other (an OS theme flip while a game theme was active would have reverted to the normal theme until the next poll corrected it).
- A broader accent-color UI pass happened alongside this (buttons, selects, team-box borders, header/status underlines all now use `var(--accent)`), so every theme - not just Ready or Not - visibly affects more of the UI than just background/text.

## Open questions

- C, D, and the E/F rank-letter boundaries are unconfirmed - need an in-game check on a mission scoring 60-79% and one scoring below 50% (see the `TODO` in `readyOrNotStats.ts`).
- "Boat" mission's real official title is unconfirmed.
- Entry-points display was explicitly dropped, not deferred - would need to be re-raised deliberately if wanted later.
