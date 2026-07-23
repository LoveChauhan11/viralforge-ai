# Sprint 1 — Upload and Media Intelligence

Goal: a creator can reliably upload local video or photo assets from mobile or desktop and receive inspectable, tenant-isolated media analysis.

## S1-01 Resumable upload sessions

Implement multipart upload creation, signed part URLs, persisted part state, completion, abort, expiry, checksum verification, and client resume.

Acceptance:

- A 2 GB maximum asset can resume after browser refresh or network loss.
- Duplicate completion and abort calls are idempotent.
- MIME sniffing, extension, size, checksum, quota, and workspace ownership are enforced server-side.
- Evidence: API integration tests, interrupted-upload E2E, and storage reconciliation test.

## S1-02 Asset lifecycle

Implement `uploading → uploaded → validating → processing → ready | rejected | failed → deleting → deleted`.

Acceptance:

- Invalid transitions return `409 STATE_CONFLICT`.
- Original objects are inaccessible except through short-lived authorized URLs.
- Delete is asynchronous, auditable, and removes derivatives before the original.

## S1-03 Probe and normalization

Use FFprobe to extract container, codecs, duration, dimensions, rotation, frame rate, audio facts, and corruption signals. Normalize orientation and unsupported inputs into mezzanine media.

Acceptance:

- MOV/MP4/WebM video and JPEG/PNG/WebP photos have deterministic handling.
- Variable-frame-rate, rotated, silent, HDR, and partially corrupt fixtures have explicit outcomes.
- Probe output is schema-validated and generator-versioned.

## S1-04 Proxies, thumbnails, and contact sheets

Generate low-bandwidth proxy video, poster frames, thumbnails, and contact sheets with checksums and lineage.

Acceptance:

- Derivatives are reproducible from recipe version plus source checksum.
- Mobile preview does not download the master source.
- Failed derivative generation can retry without duplicate object references.

## S1-05 Transcription adapter

Implement fake and production-capable transcription interfaces with language detection, word timestamps, confidence, redaction boundary, timeout, and cost metering.

Acceptance:

- Silent/no-speech media succeeds with an empty transcript.
- Provider failure leaves other analysis inspectable and retryable.
- Tests never contact a paid provider.

## S1-06 Shot and quality analysis

Detect shot boundaries and calculate blur, shake, exposure, face/saliency, motion, speech, and audio-quality facts. Persist facts, not unreviewable prose.

Acceptance:

- Every shot time range is within its asset duration and non-overlapping.
- Scores declare algorithm/model version and confidence.
- Low-confidence results are marked, not silently treated as truth.

## S1-07 Media library UX

Build upload queue and asset library with progress, pause/resume, retry, filters, preview, analysis drawer, rejection reason, and delete confirmation.

Acceptance:

- Works at 360, 768, and 1440 px with keyboard and screen reader.
- Refresh restores server truth rather than optimistic-only state.
- Empty, loading, partial-analysis, failed, offline, and quota states are covered.

## S1-08 Retention and reconciliation

Implement abandoned-upload expiry, orphan object detection, derivative cleanup, retention scheduling, and storage/database reconciliation.

Acceptance:

- Cleanup is dry-run capable, scoped, idempotent, and metricized.
- Legal/administrative holds prevent deletion.
- No job can delete an object belonging to another workspace.

## S1-09 Golden media fixtures

Create synthetic/right-cleared fixtures covering supported formats, edge cases, and expected probe/analysis facts.

Acceptance:

- Fixtures contain no private or copyrighted content.
- Expected outputs tolerate documented codec variance only.
- CI runs the representative subset; the full suite runs before release.

## S1-10 Sprint integration and handoff

Complete OpenAPI, migrations, dashboards, runbooks, cost evidence, threat review, traceability, staging smoke test, and memory-bank update.

Dependencies: S1-01 → S1-02 → S1-03 → S1-04/S1-05/S1-06 → S1-07; S1-08 and S1-09 support all; S1-10 closes the sprint.

Exit: an interrupted upload resumes, reaches `ready`, exposes deterministic analysis, and deletes cleanly in staging with no external model key in fake mode.
