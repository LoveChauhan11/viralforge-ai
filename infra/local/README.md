# Local development infrastructure (S0-03)

Starts PostgreSQL, Redis, and MinIO (S3-compatible) with healthchecks and named volumes.

```bash
# Start dependencies and wait until healthy
pnpm infra:up

# Stop (keeps volumes)
pnpm infra:down

# Reset — DELETES local database/object volumes after confirmation
pnpm infra:reset
```

Default credentials match `.env.example`. No cloud accounts required.

Note: `pnpm infra:up` waits on Postgres/Redis/MinIO only, then runs the one-shot MinIO bucket initializer. This avoids Docker Compose `--wait` failing on exited init containers.
