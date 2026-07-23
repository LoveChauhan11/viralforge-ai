# API Endpoint Specification

Authoritative HTTP contract for `/v1`. OpenAPI and the typed client are generated from implementation schemas and must pass drift checks against this document.

## Protocol

- JSON uses camelCase; timestamps are RFC 3339 UTC; IDs are UUID strings; durations are integer milliseconds.
- Authentication uses secure HTTP-only session cookies. State-changing browser requests also require CSRF protection.
- `X-Workspace-Id` is required after login. The server resolves membership; it never trusts a workspace embedded in a body.
- Every write requires `Idempotency-Key` (1–160 printable characters). Same principal, route, key, and canonical body returns the first logical result; different body returns `409 IDEMPOTENCY_CONFLICT`.
- Collections use `?limit=20&cursor=opaque`; limit is 1–100. Response: `{items, nextCursor}`.
- Success codes: `200` read/update/action result, `201` create, `202` asynchronous accepted, `204` delete/no body.
- Errors use `application/problem+json`:

```json
{
  "type": "https://viralforge.ai/problems/asset-not-ready",
  "title": "Asset is not ready",
  "status": 409,
  "code": "ASSET_NOT_READY",
  "detail": "Wait for media analysis to complete.",
  "requestId": "req_...",
  "fields": [{"path": "assetIds[0]", "code": "STATE"}],
  "retryable": true
}
```

## Shared representations

```json
{
  "job": {
    "id": "019...",
    "type": "media.analyze",
    "status": "running",
    "stage": "transcribing",
    "progress": 62,
    "retryable": false,
    "error": null,
    "result": null,
    "createdAt": "2026-07-23T10:00:00Z",
    "updatedAt": "2026-07-23T10:01:00Z"
  },
  "asset": {
    "id": "019...",
    "filename": "ride.mov",
    "mediaType": "video",
    "mimeType": "video/quicktime",
    "bytes": 42000000,
    "durationMs": 184000,
    "width": 3840,
    "height": 2160,
    "state": "ready",
    "posterUrl": "short-lived-url",
    "analysis": {"shotCount": 18, "transcriptStatus": "ready"},
    "version": 3
  },
  "project": {
    "id": "019...",
    "name": "Mountain ride",
    "objective": "Create a high-energy biking short",
    "targetDurationMs": 30000,
    "force30Seconds": false,
    "language": "en",
    "state": "planning",
    "currentVersionId": null,
    "version": 1
  }
}
```

Signed media URLs are response-only, short-lived, and never accepted as object identity.

## Identity, workspace, and profile

### `GET /me`

`200`: `{user:{id,email,displayName,avatarUrl}, memberships:[{workspaceId,workspaceName,role,status}]}`.

### `GET /workspace`

Permission: any active member. `200`: `{id,name,slug,plan,region,status,retentionPolicy,entitlements,version}`.

### `PATCH /workspace`

Permission: owner/admin; owner only for ownership/deletion handled by dedicated future flow. Body may contain `name`, `retentionPolicy`, and expected `version`. Unknown fields rejected. `200` returns workspace. `409 VERSION_CONFLICT` includes current version.

### `GET /creator-profile`

Permission: active member. `200`: profile or `404 PROFILE_NOT_FOUND`.

### `PUT /creator-profile`

Permission: owner/admin/creator/editor. Body:

```json
{
  "niches": ["motorcycling", "travel"],
  "audiences": [{"label": "Indian riders", "priority": 1}],
  "languages": ["en", "hi"],
  "regions": ["IN"],
  "toneTokens": ["energetic", "authentic"],
  "visualBrand": {"primaryColor": "#FF4D00", "captionStyle": "impact"},
  "defaultCta": "Follow for the next ride",
  "prohibitedTopics": [],
  "durationMode": "adaptive15To30",
  "approvalMode": "required",
  "version": 0
}
```

`200`: complete profile. Validation: BCP-47 languages, ISO regions, bounded arrays/text.

## Uploads and assets

### `POST /uploads`

Permission: owner/admin/creator/editor. Body: `{filename,mimeType,bytes,sha256}`. `201`:

```json
{
  "uploadId": "019...",
  "state": "uploading",
  "partSize": 16777216,
  "partCount": 3,
  "expiresAt": "2026-07-24T10:00:00Z"
}
```

Errors: `413 UPLOAD_TOO_LARGE`, `415 INVALID_MEDIA`, `429 QUOTA_EXCEEDED`.

### `POST /uploads/{uploadId}/parts`

Body: `{partNumbers:[1,2,3]}` (max 50). `200`: `{parts:[{partNumber,url,headers,expiresAt}]}`. URLs are workspace/upload scoped.

### `POST /uploads/{uploadId}/complete`

Body: `{parts:[{partNumber,etag,checksum}]}`. `202`: `{asset,job}` where asset is `validating`. Duplicate completion returns same asset/job.

### `DELETE /uploads/{uploadId}`

Permission as create; allowed before completion. `204`. Completed sessions return `409 UPLOAD_COMPLETED`.

### `GET /assets`

Query: `state`, `mediaType`, `search`, `sort=createdAt|-createdAt`, pagination. `200`: `{items:[Asset],nextCursor}`.

### `GET /assets/{assetId}`

`200`: Asset plus derivatives, shots summary, and authorized preview URLs. `404` for missing/wrong workspace.

### `DELETE /assets/{assetId}`

Body: `{version,confirm:true}`. `202`: `{asset:{id,state:"deleting"},job}`. `409 RESOURCE_IN_USE` lists project IDs safe for the caller.

## Projects and versions

### `POST /projects`

Body: `{name,objective,targetDurationMs,force30Seconds,language,assetIds?}`. `201`: Project. Target 15000–30000; if forced, target becomes 30000.

### `GET /projects`

Query `state`, `search`, pagination. `200` collection.

### `GET /projects/{projectId}`

`200`: Project with ordered assets, current version summary, render/publication summary, and allowed actions.

### `PATCH /projects/{projectId}`

Body: any editable create field plus `version`. `200`: Project. Published-project edits create a new planning lineage where required.

### `POST /projects/{projectId}/assets`

Body: `{assetIds, insertAt?}`. All assets must be `ready`. `200`: ordered `{items:[{assetId,sortOrder,eligible,notes}],projectVersion}`.

### `DELETE /projects/{projectId}/assets/{assetId}`

Body `{version}`. `204`; cannot remove an asset locked by an in-progress immutable render.

### `POST /projects/{projectId}/directions:generate`

Body: `{trendSnapshotId?, constraints?, regenerateFromJobId?}`. `202`: `{job}`. Result:

```json
{
  "directions": [{
    "id": "dir_1",
    "hook": "The corner appears before the rider is ready",
    "narrative": ["setup", "acceleration", "payoff"],
    "shotRefs": [{"shotId": "019...", "reason": "strong motion"}],
    "pacing": "fast",
    "captionApproach": "impact",
    "cta": "Would you take this turn?",
    "trendEvidence": [{"signalId": "019...", "confidence": 0.71}],
    "confidence": 0.82,
    "riskFlags": []
  }]
}
```

Exactly three directions on success.

### `POST /projects/{projectId}/versions`

Body: `{directionId|direction, locks?, requestedDurationMs?}`. `202`: `{job}`; result `{creativeVersion}` with EDL V1.

### `POST /projects/{projectId}/versions/{versionId}:regenerate`

Body: `{instruction?, preserveLocks:true, expectedVersion}`. `202`: new child-version job; never mutates source version.

### `POST /projects/{projectId}/versions/{versionId}/preview`

Body: `{expectedVersion}`. `202`: `{render:{id,kind:"preview",state:"queued"},job}`.

### `POST /projects/{projectId}/versions/{versionId}/master`

Permission: owner/admin/creator/editor. Body: `{expectedVersion}`. `202` same shape; requires valid EDL and reserves quota.

### `PATCH /projects/{projectId}/versions/{versionId}`

Body: `{operations:[{op,path,value}],expectedVersion}` using an allowlisted operation/path set for trim, order, crop, caption, transition, audio, metadata, and locks. `200`: a new child creative version; invalid edit returns field errors.

## Jobs and events

### `GET /jobs/{jobId}`

`200`: Job. Result is type-specific and schema-versioned.

### `POST /jobs/{jobId}:retry`

Permission matches originating command. Body `{reason?}`. `202`: same logical job with next attempt, only when failed and retryable.

### `POST /jobs/{jobId}:cancel`

Body `{reason?}`. `202`: Job. Cancellation is requested until worker confirms terminal `canceled`.

### `GET /events`

SSE with `Last-Event-ID`; query optional `projectId`. Events: `job.updated`, `asset.updated`, `render.updated`, `publication.updated`. Each payload contains `eventId`, `occurredAt`, resource ID/version. Heartbeat every 20 seconds; clients refetch resource after reconnect.

## Trends, insights, and DNA

### `GET /trends`

Query `niche`, `region`, `language`, `includeExpired=false`. `200`: `{snapshot,signals,audioRecommendations,fallbackMode}`. Viewer allowed.

### `GET /insights/summary`

Query `from`, `to`, `timezone`. `200`: totals, comparable baseline, top publications, sync freshness, and nullable metrics.

### `GET /insights/publications/{publicationId}`

`200`: publication metadata, snapshots, retention series, comparable baseline, narrative with evidence references, and experiments.

### `GET /content-dna`

Query `status=active`. `200`: records including provenance, confidence, sample size, locked, and version.

### `PATCH /content-dna/{recordId}`

Permission: owner/admin/creator/editor. Body: `{value?,locked?,status?,version}`. `200`: record; user edits set source/provenance accordingly.

### `POST /content-dna/{recordId}:revert`

Permission: owner/admin/creator. Body `{toVersion,reason}`. `200`: new active record with audit lineage.

## YouTube and publications

### `POST /connections/youtube:begin`

Permission owner/admin. Body `{returnPath}` allowlisted to same origin. `200`: `{authorizationUrl,stateExpiresAt}`. State is server-bound and single-use.

### `GET /connections/youtube/callback`

Query provider `code,state,error`. On success sets server connection and `303` redirects to sanitized settings path. On failure redirects with opaque error reference, never provider tokens.

### `DELETE /connections/youtube/{connectionId}`

Permission owner/admin. Body `{confirm:true}`. `204`; revocation failure is reconciled and surfaced safely.

### `POST /projects/{projectId}/publish`

Permission per authorization matrix. Body:

```json
{
  "creativeVersionId": "019...",
  "renderId": "019...",
  "connectionId": "019...",
  "title": "This turn changed the whole ride",
  "description": "Original riding footage.",
  "hashtags": ["shorts", "motorcycle"],
  "audience": "notMadeForKids",
  "language": "en",
  "categoryId": "2",
  "visibility": "private",
  "scheduledAt": null,
  "thumbnailId": null,
  "rightsConfirmed": true,
  "musicMode": "youtubeMobileHandoff",
  "approvalVersion": 1
}
```

`202`: `{publication,job,musicHandoff}`. Requires QC master, approval, ownership, valid connection, quota, and immutable metadata snapshot.

### `GET /publications/{publicationId}`

`200`: publication state, safe provider status, metadata, platform URL when available, progress, sync freshness, and music handoff.

### `POST /publications/{publicationId}:retry`

Body `{reason?}`. `202`: `{publication,job}`. Reconciles remote video/session before upload retry.

### `POST /publications/{publicationId}:confirm-music`

Body: `{status:"added"|"skipped"|"trackUnavailable", trackReference?,confirmedAt}`. `200`: updated handoff record. This is creator attestation, not API verification.

## Error/status map

`400 VALIDATION_FAILED`; `401 AUTH_REQUIRED`; `403 FORBIDDEN`; `404 NOT_FOUND`; `409 STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|RESOURCE_IN_USE|PUBLICATION_CONFLICT`; `413 UPLOAD_TOO_LARGE`; `415 INVALID_MEDIA`; `422 SCHEMA_INVALID|MEDIA_QC_FAILED`; `429 RATE_LIMITED|QUOTA_EXCEEDED|YOUTUBE_QUOTA_EXCEEDED`; `503 PROVIDER_UNAVAILABLE`; `504 PROVIDER_TIMEOUT`.

No response may contain encryption material, OAuth tokens, object keys, host paths, raw prompts with personal data, provider bodies, or expired signed URLs.
