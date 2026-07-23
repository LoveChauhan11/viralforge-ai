# ADR-019 — Provider ports with fake-first adapters

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-12

## Context

Sprint 0 requires model, transcription, trend, YouTube, and notification interfaces that work without paid credentials. Live SDKs must never leak into domain packages. Failures must degrade without corrupting workflow state. YouTube music remains Option 1 handoff (no protected-audio attachment API).

## Decision

- All external capabilities are ports in `@viralforge/providers`.
- **Fake adapters are the default** for local/test/ci; live adapters are opt-in via config and are out of scope for unit tests.
- Every call is wrapped with **timeout**, **budget metering** (tokens/bytes/calls), and **normalized `ProviderError`** codes (`timeout`, `budget_exceeded`, `unavailable`, `invalid_input`, `rejected`).
- Inputs/outputs are Zod-validated at the adapter boundary. Sensitive fields (API keys, OAuth tokens, emails in logs) are redacted via `redactProviderFields`.
- YouTube port exposes channel metadata + **music handoff instructions** only — never attach copyrighted audio binaries.

## Alternatives

- Call OpenAI/YouTube SDKs directly from workers — couples domain to vendors and blocks offline tests.

## Consequences

- Workers depend on ports; swapping live providers does not change job state machines.
- Tests assert fake mode never opens network sockets.

## Exit

Add live adapters behind the same ports in later sprints with capability metadata `mode: "live"`.
