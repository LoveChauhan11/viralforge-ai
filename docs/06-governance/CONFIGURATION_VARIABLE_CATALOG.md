# Configuration Variable Catalogue

The implemented config package is the authority and must generate/check this catalogue. Values are schema-validated at startup. Secrets are redacted and stored in Railway secret variables or the selected secret manager.

| Variable | Services | Required/default | Sensitive | Validation/owner |
|---|---|---|---:|---|
| `NODE_ENV` | all | `development` | No | development/test/staging/production; Platform |
| `APP_ENV` | all | required | No | local/ci/staging/production; Platform |
| `LOG_LEVEL` | all | `info` | No | trace..fatal; Operations |
| `SERVICE_NAME` | all | required | No | registered service token; Platform |
| `PUBLIC_WEB_URL` | web/api | required | No | HTTPS outside local; Product Platform |
| `API_BASE_URL` | web | required | No | absolute URL; Platform |
| `DATABASE_URL` | api/workers/scheduler | required | Yes | PostgreSQL TLS in production; Data owner |
| `DATABASE_POOL_MAX` | server services | `10` | No | 1–100 and capacity-budgeted |
| `REDIS_URL` | api/workers/scheduler | required | Yes | TLS/auth in production; Platform |
| `AUTH_PROVIDER` | web/api | `local` local, required prod | No | local adapter forbidden in production |
| `AUTH_SESSION_SECRET` | web/api | required | Yes | ≥32 random bytes; Security; rotate |
| `FIELD_ENCRYPTION_KEY` | api/workers | required prod | Yes | versioned ≥32 bytes; Security |
| `FIELD_ENCRYPTION_KEY_VERSION` | api/workers | required prod | No | positive integer |
| `OBJECT_STORAGE_ENDPOINT` | api/workers | required | No | S3-compatible URL |
| `OBJECT_STORAGE_REGION` | api/workers | required | No | provider region |
| `OBJECT_STORAGE_BUCKET` | api/workers | required | No | dedicated environment bucket |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | api/workers | required | Yes | Storage owner |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | api/workers | required | Yes | Storage owner; rotate |
| `OBJECT_STORAGE_FORCE_PATH_STYLE` | api/workers | `false` | No | boolean; true for local emulator |
| `SIGNED_URL_TTL_SECONDS` | api/workers | `600` | No | 60–3600 |
| `MAX_UPLOAD_BYTES` | api/web | `2147483648` | No | 1 MB–2 GB; must match product |
| `UPLOAD_PART_BYTES` | api/web | `16777216` | No | provider minimum to 128 MB |
| `UPLOAD_SESSION_TTL_HOURS` | api/scheduler | `24` | No | 1–168 |
| `RAW_MEDIA_RETENTION_DAYS` | scheduler | `30` | No | 1–365; Privacy owner |
| `QUEUE_PREFIX` | queue services | required | No | unique per environment |
| `WORKER_CONCURRENCY_GENERAL` | worker | `10` | No | capacity tested |
| `WORKER_CONCURRENCY_MEDIA` | media worker | `2` | No | 1–capacity tested |
| `JOB_DEFAULT_TIMEOUT_MS` | workers | `300000` | No | positive bounded |
| `JOB_MAX_ATTEMPTS` | workers | `3` | No | 1–10 |
| `JOB_LEASE_SECONDS` | workers | `60` | No | > heartbeat ×2 |
| `FFMPEG_PATH` | media worker | `/usr/bin/ffmpeg` | No | executable, pinned image |
| `FFPROBE_PATH` | media worker | `/usr/bin/ffprobe` | No | executable, pinned image |
| `MEDIA_TEMP_DIR` | media worker | `/tmp/viralforge` | No | ephemeral, never durable |
| `MEDIA_MAX_PROCESS_SECONDS` | media worker | `1800` | No | capacity tested |
| `AI_PROVIDER` | AI worker | `fake` | No | fake/openai/selected adapter |
| `AI_API_KEY` | AI worker | provider-dependent | Yes | AI owner; not required fake |
| `AI_MODEL_PLANNER` | AI worker | provider-dependent | No | allowlisted model |
| `AI_MODEL_NARRATIVE` | AI worker | provider-dependent | No | allowlisted model |
| `AI_REQUEST_TIMEOUT_MS` | AI worker | `60000` | No | 1s–180s |
| `AI_MAX_REPAIR_ATTEMPTS` | AI worker | `1` | No | 0–2 |
| `AI_WORKSPACE_DAILY_BUDGET_CENTS` | AI worker | plan-derived | No | nonnegative |
| `TRANSCRIPTION_PROVIDER` | AI/media | `fake` | No | registered adapter |
| `TRANSCRIPTION_API_KEY` | AI/media | provider-dependent | Yes | AI owner |
| `TREND_PROVIDER` | scheduler/AI | `manual` | No | manual/registered adapter |
| `TREND_REFRESH_HOURS` | scheduler | `24` | No | 1–168 |
| `YOUTUBE_CLIENT_ID` | api/worker | integration-dependent | No | Google Cloud owner |
| `YOUTUBE_CLIENT_SECRET` | api/worker | integration-dependent | Yes | Google Cloud owner |
| `YOUTUBE_REDIRECT_URI` | api | integration-dependent | No | exact HTTPS callback |
| `YOUTUBE_DEFAULT_VISIBILITY` | api | `private` | No | private/unlisted; never public default |
| `YOUTUBE_UPLOAD_CHUNK_BYTES` | worker | `8388608` | No | valid provider multiple |
| `YOUTUBE_DAILY_QUOTA_BUDGET` | worker | environment policy | No | positive, below project quota |
| `ANALYTICS_SYNC_CRON` | scheduler | `0 */6 * * *` | No | validated cron |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | all | optional local | No | HTTPS production |
| `OTEL_EXPORTER_OTLP_HEADERS` | all | provider-dependent | Yes | Observability owner |
| `SENTRY_DSN` | all | optional | Yes | selected ADR only |
| `RATE_LIMIT_REDIS_PREFIX` | api | environment-specific | No | nonempty |
| `FEATURE_PUBLIC_PUBLISHING` | api/web | `false` | No | kill switch; Product owner |
| `FEATURE_AUTO_DNA_APPLY` | AI/api | `false` | No | must remain false for MVP |
| `SUPPORT_ACCESS_TTL_MINUTES` | api | `30` | No | 5–120; Security |

## Rules

- Browser-exposed variables require an explicit public allowlist; no secret may use a public prefix.
- Production startup fails on fake auth, local storage, missing encryption, HTTP callbacks, or shared environment prefixes.
- Renames require a compatibility window and documentation migration; `OBJECT_STORAGE_*` and `AUTH_SESSION_SECRET` are canonical.
- Rotation owners record last/next rotation outside git. Logs print variable names and validation problems, never values.
