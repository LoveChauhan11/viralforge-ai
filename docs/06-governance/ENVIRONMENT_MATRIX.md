# Environment Matrix

| Concern | Local | CI | Staging | Production |
|---|---|---|---|---|
| Purpose | Development | Deterministic verification | Integration/UAT | Real creators |
| Providers | Fake by default | Fake only (`AI_PROVIDER=fake`, etc.) | Fake plus explicitly enabled sandbox/real tests | Approved real providers with fallback |
| Database | Container PostgreSQL | GitHub service container PostgreSQL 16 | Railway managed PostgreSQL | Railway managed PostgreSQL with backup/PITR |
| Redis | Container Redis | Optional (queue unit tests use fakes/mocks where needed) | Railway managed Redis | Railway managed Redis |
| Object storage | MinIO (`viralforge-local`) | Not required for unit gates; images built only | External staging bucket | External production bucket |
| Auth | Local adapter (`AUTH_PROVIDER=local`) | Local/test adapter only | Real auth test tenant | Real auth |
| Media | Synthetic fixtures only | Synthetic fixtures only | Approved non-private test media | User uploads |
| Secrets | Local `.env`, ignored | No paid keys; Gitleaks on PR | Railway variables | Railway variables with rotation |
| Telemetry | Console / in-memory OTel | Test assertions on spans/metrics | Staging project | Production project with redaction/retention |
| YouTube | Fake | Fake | Dedicated test channel when enabled | Creator OAuth |
| Deployment | `pnpm` processes + `docker:build` | Workflows build images; not published | Railway staging (provision pending) | Railway production |
| Supply chain | Local lint/test/drift | `quality`, `secrets`, `containers`, `analyze`, `dependency-review` | Same images promoted | Same images promoted |
| Data retention | Developer reset (`infra:reset`) | Job lifetime | Short test retention | Policy-driven and user deletion |

## Promotion rules

- Configuration is validated independently per service.
- Artifacts are built once and promoted; do not rebuild different source for production.
- Migrations are forward-compatible and execute once before new replicas receive traffic.
- Staging and production use separate credentials, buckets, OAuth clients, telemetry, and databases.
- Production cannot enable local/test auth or fake publish behavior accidentally.
- No production data is copied into local or CI.

## Variable ownership

Every environment variable must document owning service, sensitivity, default, validation, rotation, and whether it is exposed to the browser. Update `.env.example` and Railway documentation in the same change.
