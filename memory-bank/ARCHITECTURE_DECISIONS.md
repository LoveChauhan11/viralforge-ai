# Architecture Decision Memory

This is an index, not a replacement for ADR files. Accepted history is append-only.

| ADR | Status | Decision | Source |
|---|---|---|---|
| baseline-01 | accepted | Modular monolith with independently deployable web/API/workers/scheduler | `docs/02-architecture/SYSTEM_ARCHITECTURE.md` |
| baseline-02 | accepted | PostgreSQL + transactional outbox; Redis/BullMQ execution | architecture docs |
| baseline-03 | accepted | S3-compatible durable media; local disk ephemeral only | architecture/delivery docs |
| baseline-04 | accepted | Structured AI decisions; deterministic FFmpeg execution | AI/media contracts |
| baseline-05 | accepted | Manual YouTube Shorts music handoff; no protected audio attachment API | product/README |
| baseline-06 | accepted | Approval required by default; auto-learning off for MVP | product/config contracts |
| ADR-011 | accepted | Node 22–24, pnpm 9.15.9, Turborepo, TS 5.8, ESLint 9, Vitest 3 | `docs/06-governance/adr/ADR-011-toolchain-and-package-manager.md` |
| ADR-012 | accepted | Zod config validation; secret redaction; fake-local defaults | `docs/06-governance/adr/ADR-012-configuration-validation.md` |
| ADR-013 | accepted | Drizzle ORM + drizzle-kit for PostgreSQL | `docs/06-governance/adr/ADR-013-drizzle-orm.md` |

Sprint 0 must create numbered ADRs for ORM, authentication implementation, object-storage providers, transcription provider, media service language, CI/scanning, error tracking, and any deviation from these baselines.
