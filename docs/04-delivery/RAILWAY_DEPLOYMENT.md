# Railway Deployment

## Services

Create one Railway project with production and staging environments.

- web
- api
- worker-media-preview
- worker-media-master
- worker-ai
- scheduler
- PostgreSQL
- Redis

Use an external S3-compatible object store. Do not depend on Railway persistent volumes for durable media.

## Build strategy

Use one monorepo Dockerfile with named targets, or service-specific Dockerfiles sharing base stages. Pin Node, pnpm, FFmpeg, and OS image versions. Run as non-root. Include fonts required by templates. Produce an SBOM and scan the final image in CI.

Each service has a narrow start command and health endpoint. Database migrations run as an explicit release command/job, never concurrently from every API replica.

## Required environment groups

Core:

- APP_ENV
- PUBLIC_WEB_URL
- API_BASE_URL
- DATABASE_URL
- REDIS_URL
- AUTH_SESSION_SECRET
- FIELD_ENCRYPTION_KEY
- FIELD_ENCRYPTION_KEY_VERSION
- OTEL_EXPORTER endpoint variables

Object storage:

- OBJECT_STORAGE_ENDPOINT
- OBJECT_STORAGE_REGION
- OBJECT_STORAGE_BUCKET
- OBJECT_STORAGE_ACCESS_KEY_ID
- OBJECT_STORAGE_SECRET_ACCESS_KEY
- OBJECT_STORAGE_FORCE_PATH_STYLE

YouTube:

- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REDIRECT_URI

AI providers are optional adapter-specific variables. The application must boot in fake-provider mode without them.

Never commit actual values. Validate presence by service and fail with a variable name, never its value.

## Networking and health

Only web and API are publicly reachable. Workers, scheduler, database, and Redis use private networking. Health endpoints:

- /health/live: process alive.
- /health/ready: required dependencies reachable and startup complete.
- /health/startup: migrations/config version compatible.

Health checks must not invoke paid model or YouTube calls.

## Resource baseline

Begin measurement-first:

- web: 1 vCPU / 512 MB.
- api: 1 vCPU / 1 GB.
- worker-ai: 1 vCPU / 1 GB.
- preview worker: 2 vCPU / 4 GB.
- master worker: 4 vCPU / 8 GB.
- scheduler: 0.5 vCPU / 512 MB.

Treat these as initial caps, not promises. Set worker concurrency from load tests. Use temp-disk limits and reject work before exhaustion.

## Deployment flow

1. Lint, type-check, unit and contract tests.
2. Build images and run vulnerability scan.
3. Apply migrations to staging.
4. Deploy staging and run smoke/E2E tests.
5. Approve production.
6. Take/verify database backup for risky migrations.
7. Apply backward-compatible migration.
8. Deploy API/workers, then web.
9. Run production smoke checks.
10. Monitor errors, queues, render success, and publishing.
11. Roll back application if thresholds breach; data migration rollback follows the migration plan.

Use expand-and-contract database changes. Never combine destructive schema removal with the first code deployment.

## Domains and callbacks

Configure app domain, API domain if separate, HTTPS, CORS allowlist, cookie domain, OAuth callback, and YouTube authorized redirect exactly. Staging and production use separate OAuth credentials and storage prefixes.

## Cost controls

Track compute time, render seconds, storage, egress, model tokens, transcription minutes, and YouTube quota per workspace/project. Alert on queue growth, runaway retries, temp disk, and daily spend.
