# Railway deployment notes (S0-14)

## Services

Create one Railway project with **staging** and **production** environments:

| Service | Dockerfile target | Public? | Health |
|---|---|---|---|
| web | `web` | yes | `/` |
| api | `api` | yes | `/health/live` + ready `/health/ready` |
| scheduler | `scheduler` | no | `/health/live` |
| worker-general | `worker-general` | no | `/health/live` |
| worker-media | `worker-media` | no | `/health/live` |
| worker-ai | `worker-ai` | no | `/health/live` |
| migrate | `migrate` | no | one-shot release job |
| PostgreSQL | managed plugin | no | — |
| Redis | managed plugin | no | — |

Object storage is **external** S3-compatible (never Railway volume for durable media).

Per-service Railway TOML samples: `*.railway.toml` in this folder. Copy settings into each Railway service (build target + health path).

## Release order

1. Build & scan images (CI).
2. Run **migrate** once against the environment (`DATABASE_URL`).
3. Deploy api → workers/scheduler → web.
4. Smoke: `/health/ready` on API, web homepage, foundation job create (staging).

Never run migrate from every API replica.

## Build locally

```bash
docker build --target api -t viralforge-api:local .
docker build --target web -t viralforge-web:local .
docker build --target worker-general -t viralforge-worker-general:local .
docker build --target worker-media -t viralforge-worker-media:local .
docker build --target worker-ai -t viralforge-worker-ai:local .
docker build --target scheduler -t viralforge-scheduler:local .
docker build --target migrate -t viralforge-migrate:local .
```

Or: `node ./scripts/docker-build.mjs`

## Non-goals for Railway disk

- No persistent volumes for uploads/renders/masters.
- `TMPDIR=/tmp` only; media worker cleans ephemeral files after jobs (Sprint 1+).
