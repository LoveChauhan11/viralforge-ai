# System Architecture

## Shape

Start as a modular monolith plus specialized workers. This keeps delivery fast and preserves boundaries that can be extracted later.

## Railway services

1. **web** — Next.js responsive application.
2. **api** — TypeScript/Fastify API for auth, projects, publishing, policy, and analytics.
3. **worker-media** — FFmpeg/ffprobe, OpenCV where useful, transcription adapters, and media QC.
4. **worker-ai** — schema-constrained model orchestration, trend synthesis, metadata, and learning.
5. **scheduler** — trend refresh, analytics sync, retention cleanup, and stuck-job reconciliation.
6. **PostgreSQL** — system of record; pgvector only for justified semantic retrieval.
7. **Redis** — BullMQ, leases, progress, rate limits, and short-lived locks.
8. **S3-compatible storage** — sources, proxies, previews, masters, thumbnails, and manifests.

Deploy each process separately from one monorepo. Railway disks are temporary work areas, never durable user-media storage.

## Modules

Identity and Workspace; Creator DNA; Media; Projects and Creative Versions; Trends; Creative Planning; Rendering; Publishing; Analytics and Experiments; Notifications; Audit and Safety; Entitlements placeholder.

Each module owns its tables and application services. Cross-module side effects use domain events and a transactional outbox.

## End-to-end flow

1. API creates an upload session and signed multipart URLs.
2. Browser uploads directly to object storage.
3. Upload completion writes an outbox event.
4. Media worker creates proxy, transcript, shots, quality facts, and embeddings.
5. AI worker receives a bounded context pack and emits a schema-valid edit decision list.
6. Media worker renders a preview.
7. User edits, locks, and approves a new immutable creative version.
8. Final render runs media QC.
9. Publisher performs YouTube resumable upload and records the external video.
10. Scheduler syncs metrics.
11. Learning engine proposes evidence-weighted Creator DNA updates.

## Reliability

- Transactional outbox for database-to-queue consistency.
- Idempotency keys on all writes and handlers.
- Job identity includes entity, operation, and version.
- Exponential retry with jitter and a dead-letter queue.
- Heartbeats and leases for long jobs.
- Cleanup for partial objects.
- Circuit breakers around model and YouTube providers.
- Provider-independent adapters.
- Verified, deduplicated webhooks.
- Reconciliation for uploads, publishes, and analytics.

## Storage lifecycle

PostgreSQL stores metadata and small manifests. Object storage stores binaries. Redis is never the source of truth. Keys begin with workspace ID and generated IDs.

Incomplete uploads expire after 24 hours. Proxies and previews are regenerable. Source and master retention follow workspace policy. Worker temporary files are deleted after each job.

## Scaling

Scale media workers by CPU and memory class. Separate preview and final queues. Cap concurrency based on measured RAM/temp-disk usage. Enforce workspace quotas and global admission control. Cache trends by niche, region, and language.

## Baseline stack and layout

TypeScript, pnpm, Turborepo, Next.js, Fastify, PostgreSQL, Prisma or Drizzle selected by ADR, BullMQ, Redis, FFmpeg, OpenTelemetry, Vitest, Playwright, and OpenAPI.

Repository layout:

- apps/web
- apps/api
- apps/scheduler
- workers/media
- workers/ai
- packages/contracts
- packages/config
- packages/database
- packages/domain
- packages/observability
- packages/ui
- infra/railway
- docs

Domain code cannot import provider SDKs. Workers cannot import UI code.
