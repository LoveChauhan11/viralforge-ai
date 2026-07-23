# Sprint 0 — Evidence and handoff

Updated: 2026-07-23

## Scope completed

| ID | Status | Summary |
|---|---|---|
| S0-01 | evidenced | pnpm workspace, toolchain, root scripts |
| S0-02 | evidenced | web/api/workers/scheduler + shared packages |
| S0-03 | evidenced | Docker Compose Postgres/Redis/MinIO |
| S0-04 | evidenced | Zod config, fake defaults, redaction |
| S0-05 | evidenced | Drizzle models/migrations, tenancy tests |
| S0-06 | evidenced | Local auth, workspace authz, audit |
| S0-07 | evidenced | Fastify platform (request-id, problem+json, health) |
| S0-08 | evidenced | BullMQ + transactional outbox |
| S0-09 | evidenced | Foundation job vertical slice |
| S0-10 | evidenced | Next.js shell; Playwright 360/768/1440 |
| S0-11 | evidenced | Object storage ports + MinIO |
| S0-12 | evidenced | Provider fakes (model/transcription/trend/YouTube/notification) |
| S0-13 | evidenced | OpenTelemetry + log sanitize |
| S0-14 | evidenced | Dockerfile targets + Railway TOMLs |
| S0-15 | evidenced | GitHub Actions CI + supply-chain gates |
| S0-16 | evidenced | This handoff package |

## End-to-end behavior demonstrated

Authenticated foundation job: web/API create → Postgres job+outbox → scheduler dispatch → general worker progress → terminal result. Idempotent retry. Fake providers only.

## Commands run (representative)

```bash
npx pnpm@9.15.9 install
npx pnpm@9.15.9 infra:up
npx pnpm@9.15.9 migrate && npx pnpm@9.15.9 seed
npx pnpm@9.15.9 lint && npx pnpm@9.15.9 typecheck && npx pnpm@9.15.9 test
npx pnpm@9.15.9 format:check
npx pnpm@9.15.9 check:migration-drift
npx pnpm@9.15.9 check:contract-drift
npx pnpm@9.15.9 --filter @viralforge/web test:e2e
docker build --target api|web|migrate|scheduler|worker-* .
```

Full matrix: `memory-bank/TEST_EVIDENCE.md`.

## Migrations

- Tool: Drizzle ORM + drizzle-kit (`packages/database`).
- Baseline schema includes user, workspace, membership, jobs, outbox, audit, object references.
- Drift gate: `pnpm check:migration-drift`.

## Deployment

- Images: root `Dockerfile` targets; non-root `viralforge` (uid 10001); FFmpeg only on `worker-media`.
- Railway samples: `infra/railway/*.railway.toml`.
- **Not yet provisioned:** live Railway staging project (accepted residual risk `PRE-03` / `R-15`).

## Observability

- OTel spans across API → outbox → worker with W3C `traceparent`.
- Docs: `docs/04-delivery/OBSERVABILITY.md`, ADR-020.

## Security / privacy / rights

- Tenant isolation tested (DB/API/storage paths).
- Secret scan + dependency review + CodeQL + Trivy in CI (ADR-022).
- YouTube Option 1 music handoff preserved (no protected audio attach).
- No private media or credentials in git.

## Cost

- Fake providers in local/CI → $0 external AI spend for Sprint 0 gates.
- Image size residual: `S0-IMG` (~1.5GB / media ~2.2GB) — optimize later.

## Definition of Done — residual waivers

| Gate | Status | Owner / mitigation |
|---|---|---|
| Railway staging healthy | **deferred** | Platform; configs exist; provision before Sprint 1 production claims |
| Branch protection requires CI job names | **operator action** | Maintainer must enable on GitHub after first workflow run |
| Error-tracking vendor ADR | **deferred** | Track as `R-16`; console/OTel sufficient for Sprint 0 |

Critical security, tenancy, and rights gates are **not** waived.

## Sprint 1 entry criteria

Met when all are true:

1. S0-01–S0-16 evidenced (this document + memory bank).
2. Local boot works from clean checkout with fake providers (`docs/04-delivery/LOCAL_SETUP.md`).
3. CI workflows present; maintainer enables required checks (`quality`, `secrets`, `containers`, `analyze`, `dependency-review`).
4. No open Critical/High tenancy or rights defects.
5. First Sprint 1 item is `S1-01` (resumable uploads) per `SPRINT_1_BACKLOG.md`.

Railway live staging is **recommended** before claiming deployable staging, but does not block starting S1-01 against local MinIO.
