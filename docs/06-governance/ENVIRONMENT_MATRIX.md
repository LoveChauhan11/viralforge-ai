# Environment Matrix

| Concern | Local | CI | Staging | Production |
|---|---|---|---|---|
| Purpose | Development | Deterministic verification | Integration/UAT | Real creators |
| Providers | Fake by default | Fake only | Fake plus explicitly enabled sandbox/real tests | Approved real providers with fallback |
| Database | Container PostgreSQL | Ephemeral PostgreSQL | Railway managed PostgreSQL | Railway managed PostgreSQL with backup/PITR |
| Redis | Container Redis | Ephemeral Redis | Railway managed Redis | Railway managed Redis |
| Object storage | Local S3-compatible service | Ephemeral S3-compatible service | External staging bucket | External production bucket |
| Auth | Safe local adapter | Test adapter | Real auth test tenant | Real auth |
| Media | Synthetic fixtures only | Synthetic fixtures only | Approved non-private test media | User uploads |
| Secrets | Local `.env`, ignored | CI secret store only when unavoidable | Railway variables | Railway variables with rotation |
| Telemetry | Console/local collector | Test assertions | Staging project | Production project with redaction/retention |
| YouTube | Fake | Fake | Dedicated test channel when enabled | Creator OAuth |
| Deployment | Local containers/processes | Built, not public | Railway staging project | Railway production project |
| Data retention | Developer reset | Job lifetime | Short test retention | Policy-driven and user deletion |

## Promotion rules

- Configuration is validated independently per service.
- Artifacts are built once and promoted; do not rebuild different source for production.
- Migrations are forward-compatible and execute once before new replicas receive traffic.
- Staging and production use separate credentials, buckets, OAuth clients, telemetry, and databases.
- Production cannot enable local/test auth or fake publish behavior accidentally.
- No production data is copied into local or CI.

## Variable ownership

Every environment variable must document owning service, sensitivity, default, validation, rotation, and whether it is exposed to the browser. Update `.env.example` and Railway documentation in the same change.
