# Implementation Roadmap

Work in vertical slices. A sprint is complete only when code, migrations, tests, observability, docs, and Railway deployment are working.

## [Sprint 0 — Foundation](SPRINT_0_BACKLOG.md)

- pnpm/Turborepo monorepo and package boundaries.
- Next.js web, Fastify API, scheduler, media worker, AI worker.
- TypeScript strict mode, lint, formatting, test runners, OpenAPI.
- PostgreSQL, Redis/BullMQ, local S3-compatible storage.
- Typed config and fake provider adapters.
- Auth/workspace skeleton and tenant policy.
- Docker targets, Railway templates, health checks.
- OpenTelemetry, structured logs, CI, migration process.
- Architecture fitness tests preventing boundary violations.

Exit: one command boots the local stack; staging deploy is healthy; one sample job travels API → outbox → queue → worker → result.

## [Sprint 1 — Upload and media intelligence](SPRINT_1_BACKLOG.md)

Multipart upload, asset lifecycle, validation, probe/normalize, proxy, thumbnails, transcript adapter, shot detection, quality facts, mobile library UI, retention cleanup, and golden media fixtures.

Exit: interrupted uploads resume and valid media becomes ready with inspectable analysis.

## [Sprint 2 — Creator DNA and planning](SPRINT_2_BACKLOG.md)

Onboarding, Creator DNA records, trend-source adapter contract, manual seed source, context builder, agent gateway, direction generation, story, EDL schemas, locks/versioning, and evaluation fixtures.

Exit: a project with analyzed media returns three grounded directions and a valid EDL without real model keys in test mode.

## [Sprint 3 — Rendering and storyboard](SPRINT_3_BACKLOG.md)

EDL compiler, supported FFmpeg primitives, preview/master queues, progress, technical QC, responsive storyboard, trim/reorder/replace/lock, comparison, and download.

Exit: mixed media reliably produces a QC-passing 1080×1920 master of 30 seconds or less.

## [Sprint 4 — YouTube and music handoff](SPRINT_4_BACKLOG.md)

OAuth/PKCE, encrypted token handling, channel selection, metadata validation, thumbnail, resumable upload, visibility/schedule, reconciliation, idempotent publish, Option 1 music checklist and confirmation.

Exit: test-channel publish completes once despite retry and no Shorts-library music is embedded.

## [Sprint 5 — Analytics and learning](SPRINT_5_BACKLOG.md)

Scheduled analytics sync, normalized snapshots/retention, creator baseline, insight narratives, experiment records, learning proposal/policy/revert, and cost attribution.

Exit: published performance produces an inspectable recommendation and only policy-approved DNA updates.

## [Sprint 6 — Production hardening](SPRINT_6_BACKLOG.md)

Load/soak/failure tests, accessibility, security review, deletion/export, backup restore, operational dashboards/runbooks, quota enforcement, abuse controls, feature flags, and production rollout.

## Dependency order

Foundation → media → planning → rendering → publishing → analytics/learning. UX can progress with fixtures, but no downstream stage bypasses upstream contracts.

## Definition of done

- Acceptance tests and edge cases pass.
- Mobile and desktop UX reviewed.
- Schema/migration and rollback documented.
- Authorization and tenant tests present.
- Logs/metrics/traces and alerts added.
- No secrets; fake mode works.
- Failure states and retry policy tested.
- Docs/OpenAPI updated.
- Deployed and smoke-tested in staging.
