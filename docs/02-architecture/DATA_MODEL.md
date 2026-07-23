# Data Model

Use UUIDv7 identifiers and UTC timestamps. Mutable tables include createdAt, updatedAt, and optimistic version. Tenant-owned records include workspaceId.

## Identity

**users**: email, display name, avatar, status, last login.

**workspaces**: name, slug, owner, plan, region, retention policy.

**workspace_members**: user, role, status.

**oauth_connections**: provider, external account, encrypted token reference, scopes, expiry, status.

## Creator context

**creator_profiles**: niche, audiences, languages, regions, tone, visual brand, CTA, prohibited topics.

**content_dna_records**: kind, key, value JSON, provenance, scope, confidence, sample size, observation window, expiry, status.

**experiments**: hypothesis, variable, control, variant, primary metric, guardrails, state, dates.

## Media

**assets**: original filename, type, object key, SHA-256, bytes, MIME type, duration, dimensions, rotation, state, capture date, deletion date.

**asset_derivatives**: asset, kind, object key, checksum, metadata, generator version.

**shots**: asset, start/end milliseconds, transcript, labels, quality, safety, embedding.

## Trends

**trend_snapshots**: niche, region, language, source window, generation/expiry, methodology version.

**trend_signals**: snapshot, type, label, value, source, reference, observed date, confidence.

**audio_recommendations**: snapshot, platform, track, artist, platform reference, segment hint, evidence, rights mode.

## Projects

**projects**: workspace, name, objective, target duration, language, state, current version.

**project_assets**: project, asset, order, eligibility, notes.

**creative_versions**: project, parent, direction, story, EDL, metadata, locks, prompt versions, state, creator.

**renders**: creative version, preview/master kind, recipe version, object key, checksum, duration, technical report, state.

**thumbnails**: creative version, object key, source asset/time, instructions, state.

## Work orchestration

**jobs**: workspace, type, entity/version, idempotency key, queue, state, attempt, progress, safe error, timestamps, heartbeat.

**outbox_events**: aggregate, event type, payload, occurrence, publication, attempts.

**audit_events**: workspace, actor, action, target, request ID, hashed IP, metadata, occurrence.

## Publishing and learning

**publications**: project/version, connection, platform video ID, metadata, visibility, schedule, state, upload reference, publish date, safe error.

**metric_snapshots**: publication, captured time, views, engaged views, likes, comments, shares, subscribers, average view duration, average percentage viewed, viewed/swiped data, raw reference.

**retention_points**: publication, capture time, elapsed ratio, audience ratio.

**learning_updates**: workspace, publication, DNA record, proposal, policy result, applied/reversed timestamps.

## Invariants

- Creative versions are immutable once rendering starts; edits fork.
- EDL ranges must reference eligible project assets.
- Masters require passing technical QC before publication.
- Publications reference exactly one immutable version.
- Analytics are append-only.
- Object deletion is reconciled with database state.
- Tenant scope is enforced in every query and with database policies where practical.
