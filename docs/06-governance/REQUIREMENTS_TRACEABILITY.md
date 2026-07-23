# Requirements Traceability

This is the living index from product intent to implementation and evidence. Cursor must add code paths and test references as they are created.

| ID | Requirement | Source | Target area | Initial evidence |
|---|---|---|---|---|
| VF-P01 | Local media upload and managed asset library | Product requirements | Web/API/storage | Sprint 1 |
| VF-P02 | Automatic media understanding and clip selection | Product requirements | AI/media workers | Sprint 2 |
| VF-P03 | Adaptive 15–30-second vertical story with optional exact-30 mode and deterministic render | Product/media specs | Planner/media worker | S2-07, S3-01–06, E2E-AI-03 |
| VF-P04 | Preview and manual override | Product/UX | Web/API | Sprint 3 |
| VF-P05 | YouTube OAuth upload/publish | Product/API | YouTube adapter | Sprint 4 |
| VF-P06 | Option 1 music recommendation and mobile handoff | Trend/music spec | Trend/UI/publish flow | Sprint 4 |
| VF-P07 | Analytics ingestion and creator-specific learning | Product/AI memory | Analytics/memory | Sprint 5 |
| VF-N01 | Mobile-first at 360/768/1440 | UX specification | Web/design system | S0-10 Playwright (`apps/web`); 18/18 @ 360/768/1440 |
| VF-N02 | Tenant isolation across DB, API, queue, and storage | Security/data model | All services | S0-05 database IT; S0-06 authz IT; S0-11 object key scoping |
| VF-N03 | Idempotent asynchronous work with recovery | Architecture | API/outbox/queues/workers | S0-08 outbox IT; S0-09 foundation job IT + worker tests |
| VF-N04 | Schema-validated AI outputs; deterministic execution | AI architecture | Contracts/providers/workers | S0-12 `@viralforge/providers` (7); contracts package |
| VF-N05 | No durable Railway local-disk dependency | Architecture/deployment | Storage/services | S0-11 storage; S0-14 Dockerfile (no durable VOLUME); ADR-021 |
| VF-N06 | Local/fake mode requires no paid credentials | Delivery | Config/providers | S0-04 config tests; CI env fake-only; LOCAL_SETUP.md |
| VF-N07 | Observable jobs and provider usage | Operations | Telemetry | S0-13 OTel tests; OBSERVABILITY.md; ADR-020 |
| VF-N08 | Secure upload, OAuth, secret, and retention handling | Security/privacy | API/storage/integrations | S0-15 Gitleaks/CodeQL/Trivy/Dependency Review; uploads → Sprint 1 |
| VF-N09 | Compliant music/rights workflow | Trend/music | Recommendation/publish | ADR-007/019; FakeYouTubeProvider music handoff; Sprint 4 full E2E |
| VF-N10 | Explicit role authorization and cross-tenant denial | Authorization matrix | API/jobs/storage/support | S0-06 authz IT; E2E-AUTH expands Sprint 6 |
| VF-N11 | Complete typed API and stable problem errors | API endpoint specification | API/web client | S0-07 problem+json; `check:contract-drift` |
| VF-N12 | Typed outbox/events/jobs with leases, retries, cancellation and dead letters | Event/job catalogue | API/scheduler/workers | S0-08/09; foundation job cancel/fail/timeout |
| VF-N13 | AI regression gates and rights-cleared golden data | AI evaluation specification | AI/QA | Provider fakes ready; golden media → Sprint 1+ |
| VF-N14 | Server-authoritative configuration, quotas and safe production flags | Configuration catalogue | All services | S0-04 Zod config; S6-08 quotas |
| VF-N15 | Full journey, resilience, privacy and accessibility acceptance coverage | E2E acceptance catalogue | QA/release | Foundation slice + shell a11y; full catalogue Sprint 6 |

### Sprint 0 foundation evidence index

| Backlog | Implementation | Automated evidence |
|---|---|---|
| S0-01–S0-02 | root workspace, `apps/*`, `packages/*`, `workers/*` | root scripts; architecture fitness |
| S0-03 | `infra/local`, `scripts/infra.mjs` | Docker health |
| S0-04 | `@viralforge/config` | vitest |
| S0-05 | `@viralforge/database` Drizzle | migrate/seed + tenancy IT |
| S0-06 | `@viralforge/auth`, API guards | auth + authz IT |
| S0-07 | `apps/api` platform | platform IT |
| S0-08–S0-09 | queue + foundation job | dispatcher/outbox/worker/API IT |
| S0-10 | `apps/web`, `@viralforge/ui` | Playwright 18 |
| S0-11 | `@viralforge/storage` | storage + objects IT |
| S0-12 | `@viralforge/providers` | 7 vitest |
| S0-13 | `@viralforge/observability` | 3 vitest + API/worker regression |
| S0-14 | `Dockerfile`, `infra/railway/` | docker build targets |
| S0-15 | `.github/workflows/*`, drift scripts | format/drift local; GHA on push/PR |
| S0-16 | LOCAL_SETUP, SPRINT_0_EVIDENCE, provider guide | this matrix + memory bank |

## Update rule

For every implemented requirement, append exact package/file paths, API/event/schema names, automated test identifiers, deployment evidence, and the commit/PR. Do not replace the requirement wording with implementation detail.
