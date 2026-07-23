# Test Evidence

| UTC date | Commit/environment | Backlog/requirement IDs | Command or test run | Result | Evidence path/link |
|---|---|---|---|---|---|
| 2026-07-23 | local main (pre-commit) Node v24.15.0 / pnpm 9.15.9 | S0-01 | `npx pnpm@9.15.9 install && build && lint && typecheck && test && test:e2e && migrate && seed` | pass | lockfile; turbo workspaces; engines tests |
| 2026-07-23 | local | S0-02 | architecture + service-kit tests; API `GET /health/live` + `/health/ready` | pass | `{"status":"ok","service":"api"}` |
| 2026-07-23 | local | S0-03 | Docker compose files + `pnpm infra:*` scripts | implemented | runtime blocked — Docker not on PATH |
| 2026-07-23 | local | S0-04 | `@viralforge/config` vitest (4 tests) | pass | fake boot, prod guards, redaction |
| 2026-07-23 | local | S0-05 | drizzle-kit generate; database unit test (tenancy skipped without DATABASE_URL) | partial | migration SQL generated; Postgres evidence pending Docker |
| 2026-07-23 | local Docker Desktop 29.6.2 | S0-03 | `pnpm infra:up` | pass | Postgres/Redis/MinIO healthy; bucket `viralforge-local` created |
| 2026-07-23 | local DATABASE_URL=postgresql://viralforge:***@localhost:5432/viralforge | S0-05 | `pnpm migrate && pnpm seed && pnpm --filter @viralforge/database test` then re-migrate/re-seed | pass | 2/2 tenancy tests; seed idempotent (“already applied”) |
| 2026-07-23 | local Postgres | S0-06 | `@viralforge/auth` vitest (7); `@viralforge/api` authz IT (6); typecheck/lint | pass | 401/403/404 distinct; local adapter blocked in prod; audit without email |
| 2026-07-23 | local Postgres/Redis | S0-07 | `@viralforge/api` platform+authz (11); contracts tests; typecheck/lint | pass | request-id echo; Zod 400 problem+json; ready 503 when DB down; live 200 |
| 2026-07-23 | local Postgres | S0-08 | queue dispatcher (2); database outbox IT (2); typecheck/lint | pass | atomic job+outbox; idempotent create; SKIP LOCKED claim once; lease blocks peer; complete once |
| 2026-07-23 | local Postgres | S0-09 | `@viralforge/worker-general` (4); `@viralforge/api` foundation IT (4) + prior platform/authz; typecheck/lint | pass | create→outbox→worker→terminal; retry idempotent; fail/timeout/cancel visible via GET |
| 2026-07-23 | local Playwright Chromium | S0-10 | `pnpm --filter @viralforge/web test:e2e` (18); next build; typecheck/lint | pass | brand+nav all routes; no horizontal scroll; skip-link keyboard; 360/768/1440 |
| 2026-07-23 | local MinIO + Postgres | S0-11 | `@viralforge/storage` (5 incl MinIO); `@viralforge/database` objects IT (1); typecheck/lint | pass | workspace-scoped keys; signed URL redaction; soft-delete idempotent; no local-disk store |
| 2026-07-23 | local unit | S0-12 | `@viralforge/providers` (7); typecheck/lint | pass | fake-only; no fetch; budgets/timeouts; Zod IO; Option 1 music handoff; field redaction |
