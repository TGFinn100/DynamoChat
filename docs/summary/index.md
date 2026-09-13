# DynamoChat — Summary Index

Custom Electron voice-chat desktop app for Finn's Ready or Not friend group: a mandatory "Main" broadcast channel plus flexible team channels, toggled with a single hotkey.

## How We Work Best

- Never take an action (build, install, publish, deploy, or anything else non-trivial) without Finn's explicit go-ahead first, even mid-flow — this has been repeated as a hard rule, not just a default courtesy.
- Verify a fix against the actual deployed/live target, not just a local instance, before telling Finn it works — see [Deployment And Distribution](DeploymentAndDistribution.md) for an incident where a backend fix was confirmed locally but not yet pushed, so Finn's test against the live app appeared to fail.
- Commit and push a verified feature immediately, before asking Finn to test it against anything deployed — same incident above.

## Topics

- [Project Overview](ProjectOverview.md) — product concept, audio/channel model, what's explicitly out of scope for v1.
- [Architecture](Architecture.md) — monorepo structure, the LiveKit single-room/attribute-routing design, and the Electron/TypeScript/Squirrel gotchas hit along the way.
- [Implementation Status](ImplementationStatus.md) — phase-by-phase feature state, all verified.
- [Deployment And Distribution](DeploymentAndDistribution.md) — GitHub/Render/installer/auto-update, including the one open item (auto-update verification pending).

## Recently Worked On

- [Deployment And Distribution](DeploymentAndDistribution.md)
- [Implementation Status](ImplementationStatus.md)
- [Architecture](Architecture.md)
- [Project Overview](ProjectOverview.md)
