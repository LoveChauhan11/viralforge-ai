# Operations

## Service objectives

MVP monthly API availability target: 99.5%. Track user-visible job completion separately from API uptime.

Core SLIs:

- API success and latency.
- Upload completion.
- Analysis, preview, master, and publish success.
- Queue age and depth by type.
- End-to-end upload-to-preview/master time.
- Worker saturation and lease expiry.
- Provider latency/error and model spend.
- YouTube quota and auth failures.
- Storage errors and deletion backlog.

## Alert priorities

P1: cross-tenant exposure, unintended public publication, widespread data loss, or authentication outage.

P2: production creation/publishing unavailable, queue stalled, database/storage failure, or severe error spike.

P3: degraded provider, rising latency, individual job failures, stale trends, analytics delay, or budget anomaly.

Alerts must include environment, service, symptom, impact, dashboard, recent deploy, and runbook.

## Runbooks

### Queue stalled

Check Redis, queue pause, oldest job, active leases, worker health, temp disk, and recent deploy. Stop admission if capacity is unsafe. Scale or restart only after preserving job state. Reconcile expired leases.

### Render failures spike

Group by safe error code, input type, recipe/compiler, and worker image. Disable offending primitive with a feature flag. Retry only classified transient failures. Preserve failing fixture references for regression testing.

### YouTube publishing failure

Check connection status, quota, API response class, resumable session, and duplicate external ID. Do not start a second upload until reconciliation determines state. Ask user to reconnect only for an auth-class failure.

### Provider outage

Open circuit breaker, route to configured fallback, or switch to deterministic/manual mode. Do not endlessly retry paid calls. Show users a useful degraded state.

### Deletion backlog

Pause destructive retries if scope is uncertain. Verify tombstone ownership and object prefix, then resume bounded deletion. Record proof of completion.

## Backups and recovery

Automated encrypted PostgreSQL backups with documented retention. Quarterly restore drill into an isolated environment. Object storage uses versioning/lifecycle where appropriate. Redis requires no durable business recovery beyond queue reconciliation from Postgres.

Define initial recovery objectives after validation: target RPO 24 hours and RTO 4 hours for MVP, then improve based on risk.

## Release operations

Every deploy records commit, migration, image digest, feature flags, and operator. Use staging, production approval, backward-compatible migrations, smoke checks, and monitored rollout. Feature flags protect new agent behavior, render primitives, trend sources, and auto-learning.

## Support tooling

Admin views are read-only by default and tenant-audited. They show safe job timeline, asset technical facts, publication state, quota, and correlation IDs. Never expose tokens, signed URLs, full prompts, or private media to unauthorized support staff.

## Local troubleshooting

| Symptom | Check |
|---|---|
| `pnpm install` engine failure | Node 22–24; use `npx pnpm@9.15.9` if Corepack cannot write |
| Infra unhealthy | Docker Desktop running; `pnpm infra:down && pnpm infra:up` |
| API ready 503 | `DATABASE_URL` / Redis; migrate applied |
| Cross-tenant 404 vs 403 | Expected: missing resource looks like 404 when unauthorized to avoid leaks |
| Duplicate foundation jobs | Client must send same idempotency key; check outbox uniqueness |
| Worker idle | Scheduler running; Redis up; outbox claim leases not stuck |
| Docker build empty packages | Ensure `*.tsbuildinfo` ignored (`.dockerignore`); rebuild without host cache pollution |
| MinIO access denied | Bucket `viralforge-local`; path-style endpoint from `.env.example` |
| Playwright failures | `pnpm --filter @viralforge/web test:e2e`; Chromium install via Playwright |
| Format check fails on Dockerfile | Dockerfiles/toml are in `.prettierignore` |
| CI secrets false positive | Justify allowlist in `.gitleaks.toml`; security owner ack |

Full local boot: [LOCAL_SETUP.md](./LOCAL_SETUP.md). CI policy: [CI_AND_SUPPLY_CHAIN.md](./CI_AND_SUPPLY_CHAIN.md).
