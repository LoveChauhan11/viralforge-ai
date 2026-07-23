# Database Schema Specification

Authoritative logical schema for PostgreSQL. Implementation may use Prisma or Drizzle, but generated migrations must preserve these names and invariants. IDs are UUIDv7; timestamps are `timestamptz` UTC; mutable aggregates include `created_at`, `updated_at`, and integer `version`. Tenant tables require `workspace_id NOT NULL`.

## Common rules

- Email and slugs use case-insensitive unique indexes.
- JSONB fields have an explicit application schema version and size limit.
- Money/usage uses integers in smallest unit; durations use integer milliseconds.
- Soft deletion is used only where restoration is a product feature. Media deletion uses an explicit lifecycle and eventual hard delete.
- Foreign-key deletion is `RESTRICT` unless this document says `CASCADE` or `SET NULL`.
- Every tenant query includes `workspace_id`; PostgreSQL RLS is defense-in-depth, not a replacement for application guards.
- Secrets/tokens are stored as encrypted ciphertext plus key version; never searchable plaintext.

## Identity and tenancy

### `users`

`id uuid PK`; `email citext NOT NULL UNIQUE`; `display_name varchar(120)`; `avatar_url text`; `status varchar(20) CHECK active|disabled|deleted`; `last_login_at timestamptz`; timestamps/version.

### `workspaces`

`id uuid PK`; `name varchar(120)`; `slug citext UNIQUE`; `owner_user_id uuid FK users`; `plan varchar(30)`; `region varchar(30)`; `status varchar(20)`; `retention_policy jsonb`; timestamps/version.

Indexes: owner, status. Owner must have an active owner membership, enforced transactionally.

### `workspace_members`

`id uuid PK`; `workspace_id FK`; `user_id FK`; `role varchar(20) CHECK owner|admin|creator|editor|viewer`; `status varchar(20)`; `invited_by uuid`; timestamps/version.

Unique `(workspace_id,user_id)`; indexes `(user_id,status)`, `(workspace_id,role,status)`. Last active owner cannot be removed or demoted.

### `oauth_connections`

`id uuid PK`; `workspace_id`; `provider varchar(30)`; `external_account_id varchar(255)`; `display_label varchar(255)`; `scopes text[]`; `access_ciphertext bytea`; `refresh_ciphertext bytea`; `key_version smallint`; `expires_at`; `status`; `last_error_code`; timestamps/version.

Unique `(workspace_id,provider,external_account_id)`. Ciphertext fields are never returned through normal repositories.

## Creator context

### `creator_profiles`

`id uuid PK`; `workspace_id UNIQUE`; `niches text[]`; `audiences jsonb`; `languages text[]`; `regions text[]`; `tone_tokens text[]`; `visual_brand jsonb`; `default_cta text`; `prohibited_topics text[]`; `duration_mode varchar(20)`; `approval_mode varchar(20) DEFAULT 'required'`; timestamps/version.

### `content_dna_records`

`id uuid PK`; `workspace_id`; `kind varchar(40)`; `key varchar(100)`; `value jsonb`; `source varchar(20) CHECK user|inferred|experiment`; `provenance jsonb`; `confidence numeric(5,4)`; `sample_size int`; `observed_from/observed_to timestamptz`; `expires_at`; `status varchar(20)`; `locked boolean`; `supersedes_id uuid NULL`; timestamps/version.

Unique partial index `(workspace_id,kind,key) WHERE status='active'`; confidence between 0 and 1.

### `experiments`

`id uuid PK`; `workspace_id`; `hypothesis text`; `variable jsonb`; `control jsonb`; `variant jsonb`; `primary_metric varchar(60)`; `guardrails jsonb`; `sample_target int`; `state varchar(20)`; `starts_at/ends_at`; `outcome jsonb`; timestamps/version.

## Assets

### `upload_sessions`

`id uuid PK`; `workspace_id`; `object_key text UNIQUE`; `filename varchar(255)`; `declared_mime varchar(120)`; `declared_bytes bigint`; `expected_sha256 char(64)`; `multipart_upload_id text`; `part_size int`; `state varchar(20)`; `expires_at`; `completed_at`; timestamps/version.

Indexes `(workspace_id,state,created_at)`, `expires_at`. Maximum declared bytes comes from configuration and entitlement.

### `upload_parts`

`id uuid PK`; `workspace_id`; `upload_session_id FK CASCADE`; `part_number int`; `etag varchar(255)`; `bytes int`; `checksum varchar(128)`; `completed_at`.

Unique `(upload_session_id,part_number)`.

### `assets`

`id uuid PK`; `workspace_id`; `upload_session_id uuid UNIQUE`; `original_filename`; `media_type CHECK video|image|audio`; `object_key text UNIQUE`; `sha256 char(64)`; `bytes bigint`; `mime_type`; `duration_ms int`; `width/height int`; `rotation smallint`; `frame_rate numeric(10,4)`; `captured_at`; `state`; `safe_error_code`; `analysis_version`; `delete_after`; timestamps/version.

Unique `(workspace_id,sha256,bytes)` may be used for workspace-local deduplication. Index `(workspace_id,state,created_at DESC)`.

### `asset_derivatives`

`id uuid PK`; `workspace_id`; `asset_id FK CASCADE`; `kind varchar(30)`; `object_key text UNIQUE`; `sha256 char(64)`; `bytes bigint`; `metadata jsonb`; `recipe_version varchar(40)`; `runtime_version varchar(40)`; timestamps.

Unique `(asset_id,kind,recipe_version)`.

### `shots`

`id uuid PK`; `workspace_id`; `asset_id FK CASCADE`; `sequence int`; `start_ms/end_ms int`; `transcript jsonb`; `labels jsonb`; `quality jsonb`; `safety jsonb`; `embedding_ref text`; `analysis_version varchar(40)`; timestamps.

Unique `(asset_id,sequence)`; check `0 <= start_ms < end_ms <= asset.duration_ms` in service plus constraint where feasible.

## Trends

### `trend_snapshots`

`id uuid PK`; optional `workspace_id`; `niche`; `region`; `language`; `window_start/window_end`; `generated_at`; `expires_at`; `methodology_version`; `source_set jsonb`; timestamps.

Index `(niche,region,language,expires_at DESC)`.

### `trend_signals`

`id uuid PK`; `trend_snapshot_id FK CASCADE`; `type`; `label`; `value jsonb`; `source`; `source_reference text`; `observed_at`; `confidence numeric(5,4)`; `rights_mode`; timestamps.

### `audio_recommendations`

`id uuid PK`; `trend_snapshot_id FK`; `platform`; `track`; `artist`; `platform_reference`; `segment_hint jsonb`; `evidence jsonb`; `rights_mode CHECK handoff_only|licensed|original`; `expires_at`; timestamps.

## Projects and creative versions

### `projects`

`id uuid PK`; `workspace_id`; `name`; `objective text`; `target_duration_ms int CHECK 15000..30000`; `force_30_seconds boolean`; `language`; `state`; `current_version_id uuid NULL`; timestamps/version.

Index `(workspace_id,state,updated_at DESC)`.

### `project_assets`

`id uuid PK`; `workspace_id`; `project_id FK CASCADE`; `asset_id FK RESTRICT`; `sort_order int`; `eligible boolean`; `notes text`; timestamps/version.

Unique `(project_id,asset_id)` and `(project_id,sort_order)`.

### `creative_versions`

`id uuid PK`; `workspace_id`; `project_id FK CASCADE`; `parent_id uuid`; `sequence int`; `direction jsonb`; `story jsonb`; `edl jsonb`; `metadata jsonb`; `locks jsonb`; `context_hash char(64)`; `prompt_versions jsonb`; `state`; `created_by uuid`; timestamps.

Unique `(project_id,sequence)`. Once state reaches `rendering`, creative payload columns are immutable; edits create a child.

### `renders`

`id uuid PK`; `workspace_id`; `creative_version_id FK`; `kind CHECK preview|master`; `recipe_version`; `runtime_version`; `object_key text`; `sha256 char(64)`; `bytes bigint`; `duration_ms`; `technical_report jsonb`; `state`; `safe_error_code`; timestamps/version.

Unique partial `(creative_version_id,kind,recipe_version) WHERE state='ready'`.

### `thumbnails`

`id uuid PK`; `workspace_id`; `creative_version_id`; `object_key`; `source_asset_id`; `source_time_ms`; `instructions jsonb`; `state`; timestamps/version.

## Jobs, events, and audit

### `jobs`

`id uuid PK`; `workspace_id`; `type`; `entity_type`; `entity_id`; `entity_version`; `idempotency_key varchar(160)`; `queue`; `state`; `stage`; `progress smallint`; `attempt_count int`; `max_attempts int`; `retryable boolean`; `safe_error_code`; `safe_error_detail jsonb`; `result jsonb`; `lease_owner`; `lease_expires_at`; `heartbeat_at`; `requested_by uuid`; `started_at/finished_at`; timestamps/version.

Unique `(workspace_id,type,idempotency_key)`. Indexes `(queue,state,created_at)`, `(workspace_id,entity_type,entity_id)`, `lease_expires_at`.

### `job_attempts`

`id uuid PK`; `workspace_id`; `job_id FK CASCADE`; `attempt_no int`; `worker_id`; `started_at/finished_at`; `outcome`; `safe_error_code`; `metrics jsonb`.

Unique `(job_id,attempt_no)`.

### `outbox_events`

`id uuid PK`; `workspace_id`; `aggregate_type`; `aggregate_id`; `aggregate_version`; `event_type`; `schema_version`; `payload jsonb`; `occurred_at`; `published_at`; `claim_owner`; `claim_expires_at`; `attempts`; `last_error_code`.

Unique `(aggregate_type,aggregate_id,aggregate_version,event_type)`; index unpublished occurrence.

### `audit_events`

`id uuid PK`; `workspace_id`; `actor_type`; `actor_id`; `action`; `target_type`; `target_id`; `request_id`; `ip_hash`; `metadata jsonb`; `occurred_at`.

Append-only; index `(workspace_id,occurred_at DESC)`, `(target_type,target_id)`.

### `object_references`

`id uuid PK`; `workspace_id`; `owner_type`; `owner_id`; `object_key UNIQUE`; `purpose`; `state`; `delete_after`; `deleted_at`; timestamps/version.

## Publishing and learning

### `publications`

`id uuid PK`; `workspace_id`; `project_id`; `creative_version_id`; `render_id`; `connection_id`; `platform`; `platform_video_id`; `upload_session_uri_ciphertext`; `key_version`; `metadata jsonb`; `visibility`; `scheduled_at`; `state`; `approval_actor_id`; `approved_at`; `published_at`; `safe_error_code`; timestamps/version.

Unique `(workspace_id,platform,platform_video_id)` when non-null; one active publication per idempotency key via associated job.

### `metric_snapshots`

`id uuid PK`; `workspace_id`; `publication_id FK CASCADE`; `captured_at`; nullable metric columns (`views`, `engaged_views`, `likes`, `comments`, `shares`, `subscribers_gained`, `average_view_duration_ms`, `average_percentage_viewed`, `viewed_ratio`); `definition_version`; `raw_reference`; timestamps.

Unique `(publication_id,captured_at,definition_version)`.

### `retention_points`

`id uuid PK`; `workspace_id`; `metric_snapshot_id FK CASCADE`; `elapsed_ratio numeric(6,5)`; `audience_ratio numeric(8,5)`.

Unique `(metric_snapshot_id,elapsed_ratio)`.

### `learning_updates`

`id uuid PK`; `workspace_id`; `publication_id`; `dna_record_id`; `proposal jsonb`; `policy_result jsonb`; `state`; `approved_by`; `applied_at`; `reverted_at`; `prior_value jsonb`; timestamps/version.

## Migration and validation gates

- Migrations are forward-only in shared environments and include a tested rollback/compensating plan.
- Destructive changes use expand/backfill/contract.
- CI creates an empty database, migrates, seeds, reruns safely, and checks schema drift.
- Integration tests prove cross-workspace reads/writes fail for every tenant table.
- Backup restore and deletion reconciliation are Sprint 6 release gates.
