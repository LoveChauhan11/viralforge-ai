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
