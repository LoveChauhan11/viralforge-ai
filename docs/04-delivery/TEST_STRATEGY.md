# Test Strategy

## Test pyramid

### Unit

Domain state transitions, duration math, crop geometry, safe zones, metadata limits, trend score components, learning policy, retry classification, idempotency, and EDL validation.

### Contract

OpenAPI request/response compatibility, event payload schemas, provider adapters, object-store interface, YouTube adapter, and model gateway fixtures.

### Integration

PostgreSQL migrations and queries, tenant scoping, outbox-to-queue delivery, Redis leases, multipart completion, OAuth token refresh, job retries, deletion reconciliation, and analytics normalization. Use real Postgres/Redis containers.

### Media golden tests

A small licensed fixture corpus covers portrait, landscape, variable frame rate, rotated MOV, HEIC, silent video, stereo/mono audio, corrupted files, long GOP, emojis/non-Latin captions, still images, rapid motion, and edge safe zones.

For each fixture assert probe facts, normalized duration, generated shots, deterministic recipe, successful decode, dimensions, frame count tolerance, loudness bounds, caption placement, and visual snapshots where stable.

### AI evaluations

Fake adapters are default in CI. Golden structured cases test schema validity, duration budget, eligible asset use, evidence citation, unsupported primitive rejection, metadata limits, hallucination resistance, and prompt-injection isolation. Real-provider evaluation runs manually or on a controlled schedule with budget.

### End-to-end

Playwright covers onboarding, interrupted upload, analysis, direction selection, storyboard edits/locks, preview, failed-job retry, master QC, YouTube connection mock, publish approval, Option 1 music handoff, insights, and deletion.

## Non-functional

- Load test API and queue admission.
- Benchmark preview/master workers with representative media.
- Soak test queue leasing and retries.
- Security test authorization matrix and tenant isolation.
- Accessibility test automated rules plus keyboard/manual screen-reader pass.
- Browser/device matrix: current Chrome, Edge, Safari, Firefox; iOS Safari and Android Chrome responsive paths.
- Failure injection: provider timeouts, Redis restart, DB disconnect, worker death, object-store 5xx, YouTube quota/reauth.

## Release gates

A production candidate requires:

- Clean lint, type-check, unit, integration, contract, and E2E.
- No critical/high exploitable security finding.
- All database migrations rehearsed and backward compatible.
- Media golden suite passes.
- Error and performance budgets meet agreed thresholds.
- Staging publish flow passes with test channel.
- Rollback and feature flags verified.
- Product acceptance of mobile golden path.

## Acceptance scenarios

- A mixed set of landscape/portrait assets creates a valid 30-second-or-shorter 1080×1920 master.
- Regeneration does not change locked decisions.
- No protected Shorts-library track is embedded in Option 1.
- Failed final render is never publishable.
- Duplicate publish requests create one external upload.
- Revoked YouTube access yields a clear reconnect action.
- Deleted project media becomes inaccessible and deletion is reconciled.
- Analytics change recommendations only after learning-policy thresholds.
