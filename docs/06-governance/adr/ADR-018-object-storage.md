# ADR-018 — S3-compatible object storage (AWS SDK v3)

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-11

## Context

Durable binaries must live in S3-compatible object storage (never Railway/app local disk). Local development uses MinIO. Architecture already requires workspace-scoped keys and short-lived signed URLs that must never appear in logs.

## Decision

- **`@viralforge/storage`** owns the `ObjectStorage` port plus:
  - **In-memory / fake** adapter for unit tests (no network, no credentials).
  - **S3-compatible** adapter via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (MinIO locally; any S3 API in staging/production).
- Object keys **must** begin with `{workspaceId}/`. Helper `buildObjectKey` / `assertWorkspaceScopedKey` enforce this; cross-tenant keys throw.
- Key layout: `{workspaceId}/{purpose}/{objectId}/{safeFileName}`.
- Signed GET/PUT URLs are TTL-bounded; `redactSignedUrl` strips query strings before any log field.
- PostgreSQL `object_references` stores metadata (workspace, key, purpose, state). Soft-delete is idempotent; physical delete follows via storage adapter.
- Fake mode remains the default for tests; MinIO credentials are only required when constructing the S3 adapter.

## Alternatives

- MinIO-only SDK — less portable to managed S3.
- Store binaries on local disk in local/dev — violates durable-storage baseline.

## Consequences

- Apps/workers depend on the storage port, not AWS types.
- Integration tests against MinIO are optional (`OBJECT_STORAGE_*` present); unit tests always use the fake adapter.

## Exit

Swap SDK behind the same port if a different S3 client is mandated.
