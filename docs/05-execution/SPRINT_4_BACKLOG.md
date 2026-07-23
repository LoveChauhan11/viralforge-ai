# Sprint 4 — YouTube Publishing and Music Handoff

Goal: a creator explicitly approves and publishes one immutable master to YouTube exactly once, with a safe Option 1 Shorts-music handoff.

## S4-01 OAuth connection

Implement Google OAuth Authorization Code with PKCE, state/nonce, least scopes, encrypted token storage, refresh, revocation, and channel discovery.

Acceptance:

- Tokens never reach browser storage, logs, analytics, or database plaintext.
- Expired/revoked consent produces a reauthorization state.
- Connection and disconnection are audited.

## S4-02 Channel selection and policy

Allow authorized creators to choose a channel, verify upload capability, display quota/permission state, and prevent cross-workspace connection use.

Acceptance:

- Channel identity is reconfirmed before first publish.
- Removed channel access blocks future jobs without corrupting prior publications.
- Viewer/editor roles cannot connect or switch channels.

## S4-03 Metadata and thumbnail

Validate title, description, hashtags, audience declaration, language, category, visibility, schedule, thumbnail, and creator confirmation.

Acceptance:

- Server enforces platform lengths and required declarations.
- Generated metadata remains editable and versioned.
- Rights/safety confirmation is stored with the publication request.

## S4-04 Resumable YouTube upload

Implement resumable session creation, chunk upload, checkpoint persistence, retry/backoff, reconciliation, quota accounting, and provider error normalization.

Acceptance:

- Worker death resumes from acknowledged bytes.
- One idempotency key cannot create multiple platform videos.
- Ambiguous provider timeout triggers reconciliation before retry.

## S4-05 Publication state machine

Implement `draft → awaitingApproval → queued → uploading → processing → published | scheduled | failed | canceled | removed`.

Acceptance:

- Publishing always references one QC-passing immutable master.
- Default workflow requires explicit creator/owner approval.
- State is reconciled with platform truth and all transitions are audited.

## S4-06 Option 1 music handoff

Display recommended YouTube Shorts track, artist, segment/cue, edit beat notes, suggested volume, freshness, and mobile checklist. Export/upload without that protected track.

Acceptance:

- UI clearly states that track addition occurs in the YouTube mobile app.
- `confirm-music` records creator confirmation only; it never claims API attachment.
- Expired/unavailable recommendations offer a silent/original-audio fallback.

## S4-07 Scheduling and reconciliation

Implement permitted schedule/visibility behavior, periodic status checks, manual refresh, processing timeout, and removed/private handling.

Acceptance:

- UTC storage and creator-local display are tested across DST.
- Scheduling conflicts return actionable errors.
- Reconciliation is idempotent and rate-budgeted.

## S4-08 Publishing UX

Build review/approval, connection, channel, metadata, progress, handoff, success, retry, reauth, quota, and partial-processing screens.

Acceptance:

- A user always knows whether content exists locally, on YouTube, or both.
- Destructive disconnect/cancel actions explain impact.
- Mobile deep-link/copy/download fallbacks work without assuming YouTube app availability.

## S4-09 Security and provider test suite

Add fake YouTube server plus contract tests for OAuth attacks, token expiry, 401/403/404/409/429/5xx, ambiguous timeouts, duplicate requests, and quota exhaustion.

Acceptance:

- CI requires no Google credentials.
- Staging live test uses a designated test channel and private/unlisted visibility.
- No test can publish publicly by default.

## S4-10 Sprint handoff

Complete OpenAPI, consent/privacy copy, runbook, alerts, quota/cost evidence, threat model, E2E evidence, traceability, and memory update.

Dependencies: S4-01 → S4-02; S4-03 → S4-04 → S4-05/S4-07; S4-06/S4-08 span the flow; S4-09 → S4-10.

Exit: a staging test-channel upload completes once despite injected retry, remains private/unlisted by default, and provides the accurate manual Shorts-music checklist.
