# ADR-021 — Container images and Railway release shape

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-14

## Context

Sprint 0 requires production images for web, API, workers, and scheduler, plus Railway definitions. Migrations must not run on every replica. Durable media must not use Railway local disk. FFmpeg belongs only on media workers.

## Decision

- **One monorepo `Dockerfile`** with named targets: `api`, `web`, `worker-general`, `worker-media`, `worker-ai`, `scheduler`, `migrate`.
- Base image: **Node 22.14 bookworm-slim**, pnpm **9.15.9** via Corepack.
- Processes run as non-root user `viralforge` (UID 10001).
- **`TMPDIR=/tmp`** only; no VOLUME mounts for durable media. Object storage remains authoritative.
- **FFmpeg** installed only in `worker-media`.
- **Migrations**: dedicated `migrate` image/command used as a Railway release/pre-deploy step (`node packages/database/dist/migrate.js`), never from API replicas.
- Railway service configs live under `infra/railway/` with per-service `Dockerfile` target and health paths.
- Next.js uses **`output: "standalone"`** for the web image.

## Alternatives

- Per-service Dockerfiles — more duplication; rejected for Sprint 0.
- Migrate-on-boot in API — races and duplicate migrators; rejected.

## Consequences

- CI (S0-15) builds each target and scans images.
- Staging/production must set managed `DATABASE_URL` / `REDIS_URL` and external object-storage credentials; fake providers remain allowed where config permits.

## Exit

Split Dockerfiles later if image size or build time demands it; keep the same target names and health contracts.
