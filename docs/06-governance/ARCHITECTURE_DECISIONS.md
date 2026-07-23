# Architecture Decisions

## ADR-001 — Modular monolith with workers

**Status:** Accepted.

Use one repository and shared domain contracts with separate web, API, scheduler, media-worker, and AI-worker processes. This avoids premature microservices while isolating resource-heavy media and provider workloads.

## ADR-002 — Deterministic rendering

**Status:** Accepted.

Models emit a validated Edit Decision List. A versioned compiler creates the FFmpeg recipe. Models never generate or execute shell commands. This provides reproducibility, security, testability, and cost control.

## ADR-003 — PostgreSQL is the source of truth

**Status:** Accepted.

Business state, jobs, and outbox live in PostgreSQL. Redis accelerates queues/locks only; object storage holds binaries. Lost Redis state can be reconciled.

## ADR-004 — Direct multipart object upload

**Status:** Accepted.

Clients upload through short-lived signed multipart URLs. API instances do not proxy large media. Completion verifies object facts before analysis.

## ADR-005 — Versioned immutable creative outputs

**Status:** Accepted.

Editing forks a creative version. Published and rendered versions do not mutate. This supports reproducibility, audit, comparisons, and safe retries.

## ADR-006 — Provider adapters and fake mode

**Status:** Accepted.

YouTube, model, transcription, trend, and storage providers sit behind internal interfaces. Fake adapters are first-class and allow development/test without keys.

## ADR-007 — Option 1 for Shorts music

**Status:** Accepted.

ForgeOS may recommend and beat-plan against a YouTube Shorts library track but does not embed or attach it through unsupported means. The user completes music selection in the YouTube app. Licensed/original audio follows a separate rights-aware automatic path.

## ADR-008 — Railway plus external object storage

**Status:** Accepted.

Stateless services run on Railway. PostgreSQL and Redis may be Railway-managed. Durable media uses S3-compatible storage. Worker disk is temporary and bounded.

## ADR-009 — Evidence-aware Creator DNA

**Status:** Accepted.

Facts, declared preferences, observations, hypotheses, rejections, and experiments are separate versioned records with provenance, confidence, and decay. No opaque self-modifying master prompt.

## ADR-010 — Explicit publication approval

**Status:** Accepted for MVP.

A user approves a specific immutable master and metadata version. Automation may prepare and upload according to that choice, but unattended default publishing is outside MVP.

## Decisions Cursor must complete

Create additional ADRs during Sprint 0 for:

- Prisma versus Drizzle.
- Authentication implementation.
- S3 provider and local emulator.
- Transcription adapter.
- Whether media worker remains TypeScript or adds a narrow Python service.
- CI provider and container scanning tools.
- Error tracking vendor.

Each ADR must state context, decision, alternatives, consequences, and migration/exit strategy.

## Sprint 0 ADRs recorded

| ADR | Status | Decision |
|---|---|---|
| [ADR-011](adr/ADR-011-toolchain-and-package-manager.md) | Accepted | Node 22–24, pnpm 9.15.9, Turborepo, TypeScript 5.8, ESLint 9, Vitest 3, Playwright |
| [ADR-012](adr/ADR-012-configuration-validation.md) | Accepted | Zod schema-validated config; secret redaction; fake-local defaults |
| [ADR-013](adr/ADR-013-drizzle-orm.md) | Accepted | Drizzle ORM + drizzle-kit migrations for PostgreSQL |
| [ADR-014](adr/ADR-014-local-auth-adapter.md) | Accepted | Local header auth adapter; forbidden in staging/production |
| [ADR-015](adr/ADR-015-fastify-api.md) | Accepted | Fastify for apps/api; service-kit remains for workers |
| [ADR-016](adr/ADR-016-bullmq-transactional-outbox.md) | Accepted | BullMQ + Postgres transactional outbox; SKIP LOCKED claims |
