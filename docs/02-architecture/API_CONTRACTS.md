# API Contracts

Base path: /v1. External JSON is camelCase. Generate OpenAPI from code and a typed web client. Every write accepts an Idempotency-Key header. Errors use problem-details JSON with a stable code.

## Endpoints

Identity and profile:

- GET /me
- GET and PATCH /workspace
- GET and PUT /creator-profile

Uploads and media:

- POST /uploads
- POST /uploads/{id}/parts
- POST /uploads/{id}/complete
- DELETE /uploads/{id}
- GET /assets
- GET and DELETE /assets/{id}

Projects:

- POST and GET /projects
- GET and PATCH /projects/{id}
- POST /projects/{id}/assets
- DELETE /projects/{id}/assets/{assetId}
- POST /projects/{id}/directions:generate
- POST /projects/{id}/versions
- POST /projects/{id}/versions/{versionId}:regenerate
- POST /projects/{id}/versions/{versionId}/preview
- POST /projects/{id}/versions/{versionId}/master

Jobs:

- GET /jobs/{id}
- POST /jobs/{id}:retry
- POST /jobs/{id}:cancel
- GET /events for authenticated server-sent job events

Trends and insights:

- GET /trends
- GET /insights/summary
- GET /insights/publications/{id}
- GET /content-dna
- PATCH /content-dna/{id}
- POST /content-dna/{id}:revert

YouTube:

- POST /connections/youtube:begin
- GET /connections/youtube/callback
- DELETE /connections/youtube/{id}
- POST /projects/{id}/publish
- GET /publications/{id}
- POST /publications/{id}:retry
- POST /publications/{id}:confirm-music

## Edit Decision List V1

Fields:

- schemaVersion.
- canvas: 1080×1920 and frame rate.
- durationMs, never above 30000.
- shots: assetId, sourceStartMs, sourceEndMs, timelineStartMs, crop, speed, transition.
- captions: startMs, endMs, text, styleToken, safeZone.
- overlays and CTA using supported tokens.
- audio: renderMode, originalGainDb, and optional recommendedTrackId.

Validation rejects missing assets, invalid time ranges, overlaps outside supported transitions, unsafe zones, unsupported primitives, or duration overflow.

## Job response

Return id, type, status, stage, integer progress, retryable, safe error, and result. Status values are queued, running, retrying, succeeded, failed, and canceled.

## Stable error codes

AUTH_REQUIRED, FORBIDDEN, QUOTA_EXCEEDED, INVALID_MEDIA, UPLOAD_INCOMPLETE, ASSET_NOT_READY, SCHEMA_INVALID, PROVIDER_UNAVAILABLE, RENDER_FAILED, MEDIA_QC_FAILED, YOUTUBE_REAUTH_REQUIRED, YOUTUBE_QUOTA_EXCEEDED, and PUBLICATION_CONFLICT.

Never return secrets, signed URLs after expiry, raw prompts containing personal data, host filesystem paths, or provider error bodies.
