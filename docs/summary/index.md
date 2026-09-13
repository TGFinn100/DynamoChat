# DynamoChat — Summary Index

Custom Electron voice-chat desktop app for Finn's Ready or Not friend group: a mandatory "Main" broadcast channel plus flexible team channels, toggled with a single hotkey.

## How We Work Best

- Never take an action (build, install, publish, deploy, or anything else non-trivial) without Finn's explicit go-ahead first, even mid-flow — this has been repeated as a hard rule, not just a default courtesy.
- Verify `git status` is clean immediately before any build/publish/deploy step, and before telling Finn to test something against a live/deployed target — don't assume the working tree matches what was just changed. See [Deployment And Distribution](DeploymentAndDistribution.md) for three separate incidents this caused in one session before it became standard practice.

## Topics

- [Project Overview](ProjectOverview.md) — product concept, audio/channel model, what's explicitly out of scope for v1.
- [Architecture](Architecture.md) — monorepo structure, the LiveKit single-room/attribute-routing design, the theme system, and gotchas hit along the way.
- [Implementation Status](ImplementationStatus.md) — full v1 feature state, all verified, including Settings (hotkey remap, devices, themes) and name persistence.
- [Game Integration](GameIntegration.md) — the v0.7.0 round: in-game overlay (anti-cheat-safe, no DirectX hooking), Ready or Not stats via a from-scratch GVAS save-file parser, and theme auto-switch tied to game detection.
- [Deployment And Distribution](DeploymentAndDistribution.md) — GitHub/Render/installer/auto-update, now fully confirmed working end-to-end.

## Recently Worked On

- [Game Integration](GameIntegration.md)
- [Deployment And Distribution](DeploymentAndDistribution.md)
- [Project Overview](ProjectOverview.md)
- [Architecture](Architecture.md)
- [Implementation Status](ImplementationStatus.md)
