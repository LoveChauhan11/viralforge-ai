# ADR-023 — Resumable multipart uploads

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S1-01

## Context

S1-01 requires direct-to-object-storage multipart uploads with resume after refresh, idempotent complete/abort, and server-side MIME/size/checksum/quota/workspace checks. ADR-004 already chooses direct multipart. The Sprint 0 API embeds workspace IDs in paths (`/v1/workspaces/:workspaceId/...`), while the endpoint catalogue lists `/uploads`.

## Decision

1. **HTTP paths:** Nest under workspace for consistency with jobs:
   - `POST /v1/workspaces/:workspaceId/uploads`
   - `GET /v1/workspaces/:workspaceId/uploads/:uploadId` (resume: session + completed parts)
   - `POST /v1/workspaces/:workspaceId/uploads/:uploadId/parts`
   - `POST /v1/workspaces/:workspaceId/uploads/:uploadId/complete`
   - `DELETE /v1/workspaces/:workspaceId/uploads/:uploadId` (abort)
2. **Storage port:** Extend `ObjectStorage` with multipart create/sign-part/list-parts/complete/abort plus `uploadPart` for fake/local test fulfillment without HTTP.
3. **Persistence:** `upload_sessions`, `upload_parts`, and a minimal `assets` row created on successful complete (`state=validating`). Full lifecycle transitions are S1-02.
4. **Permissions:** `upload:create`, `upload:read`, `upload:abort` (viewer: read only).
5. **Limits from config:** `MAX_UPLOAD_BYTES` (2 GiB), `UPLOAD_PART_BYTES`, `UPLOAD_SESSION_TTL_HOURS`, `SIGNED_URL_TTL_SECONDS`, `MAX_PROJECT_ASSETS` (workspace asset quota until project-scoped quotas land).

## Alternatives

- Flat `/v1/uploads` + `X-Workspace-Id` — diverges from existing Fastify routes.
- Proxy bytes through API — rejected by ADR-004 / Railway disk constraints.

## Consequences

- Clients must use workspace-scoped paths (document in OpenAPI when generated).
- Memory storage implements multipart for CI without MinIO; production uses S3/MinIO multipart APIs.
- Complete does not yet enqueue analysis jobs (S1-02/S1-03).

## Exit

OpenAPI generator can alias catalogue paths; asset lifecycle expands without changing multipart storage port.
