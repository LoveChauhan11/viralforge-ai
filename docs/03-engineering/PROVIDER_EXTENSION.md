# Provider extension guide

All external integrations live behind ports in `@viralforge/providers`. Automated tests and local/CI default to fake adapters — never require paid keys.

## Ports

| Port | Interface | Fake | Notes |
|---|---|---|---|
| Model | `ModelProvider` | `FakeModelProvider` | Schema-validated structured outputs |
| Transcription | `TranscriptionProvider` | `FakeTranscriptionProvider` | Synthetic transcripts |
| Trends | `TrendProvider` | `FakeTrendProvider` | Manual/synthetic trends |
| YouTube | `YouTubeProvider` | `FakeYouTubeProvider` | OAuth/publish stubs; **Option 1 music handoff only** |
| Notification | `NotificationProvider` | `FakeNotificationProvider` | No external delivery |

Shared helpers (`packages/providers/src/common.ts`):

- `ProviderError` + normalized codes
- `ProviderBudget` / `consumeBudget`
- `withTimeout`
- `redactProviderFields`

## Adding a real adapter

1. Implement the existing interface in `packages/providers/src/` (do not widen domain packages with SDK imports).
2. Keep Zod validation on inputs/outputs at the boundary.
3. Wire selection through `@viralforge/config` (`*_PROVIDER` enums). Default remains `fake` for local/CI/test.
4. Add unit tests that **never** call the network; use recorded fixtures or fake mode.
5. Document new env vars in `.env.example`, `CONFIGURATION_VARIABLE_CATALOG.md`, and Railway docs.
6. Redact secrets, tokens, and signed URLs before logging/telemetry.
7. Respect budgets, timeouts, and graceful degradation (do not corrupt job state on provider failure).

## YouTube music (non-negotiable)

YouTube Shorts library tracks cannot be attached via third-party API. Adapters must preserve Option 1:

1. Recommend track + timing + volume.
2. Export/publish **without** protected audio.
3. Creator completes music in the YouTube mobile app.

See ADR-007 / ADR-019.

## Selection

Config chooses the adapter at process start. Production must reject accidental local/fake publish modes that would mislead creators (see environment matrix promotion rules).
