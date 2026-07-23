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
| ADR-014 | accepted | Local header auth; forbidden in staging/production | `docs/06-governance/adr/ADR-014-local-auth-adapter.md` |
| ADR-015 | accepted | Fastify for apps/api; service-kit for workers | `docs/06-governance/adr/ADR-015-fastify-api.md` |
| ADR-016 | accepted | BullMQ + transactional outbox; SKIP LOCKED claims | `docs/06-governance/adr/ADR-016-bullmq-transactional-outbox.md` |
| ADR-017 | accepted | Next.js App Router for apps/web; /v1 rewrites; @viralforge/ui | `docs/06-governance/adr/ADR-017-nextjs-web.md` |
| ADR-018 | accepted | S3-compatible storage via AWS SDK v3; workspace-scoped keys; signed URL redaction | `docs/06-governance/adr/ADR-018-object-storage.md` |
| ADR-019 | accepted | Provider ports fake-first; budgets/timeouts; YouTube Option 1 music handoff | `docs/06-governance/adr/ADR-019-provider-ports.md` |
| ADR-020 | accepted | OpenTelemetry API/SDK; InMemory exporters; W3C traceparent on jobs | `docs/06-governance/adr/ADR-020-opentelemetry.md` |
| ADR-021 | accepted | Monorepo Dockerfile targets; Railway migrate-as-release; non-root; FFmpeg media-only | `docs/06-governance/adr/ADR-021-containers-railway.md` |
| ADR-022 | accepted | GitHub Actions CI; Gitleaks; Dependency Review; CodeQL; Trivy; drift gates | `docs/06-governance/adr/ADR-022-ci-supply-chain.md` |

Sprint 0 ADRs for ORM, auth, storage, providers, OTel, containers, and CI are recorded. Error-tracking vendor deferred (`R-16`).
