# Sprint 2 — Creator DNA, Trends, and Creative Planning

Goal: analyzed assets and creator context produce three grounded creative directions and an immutable, schema-valid edit decision list (EDL).

## S2-01 Creator onboarding and profile

Capture niche, audience, languages, regions, tone, visual identity, CTA, prohibited topics, duration preference, and default approval mode.

Acceptance:

- Defaults are editable and versioned.
- Sensitive free text is excluded from logs and analytics.
- Incomplete onboarding can resume on another device.

## S2-02 Creator DNA store

Implement typed DNA records with provenance, confidence, sample size, observation window, status, supersession, expiry, and user lock.

Acceptance:

- User-set facts outrank inferred facts.
- Locked facts cannot be changed by learning jobs.
- Every applied or reverted change is audited.

## S2-03 Trend adapter and manual seed

Implement provider-neutral trend snapshots plus an admin/manual seed source using permitted public data and source references.

Acceptance:

- Each signal has observed time, region, language, confidence, expiry, and provenance.
- Stale signals are excluded from generation.
- Provider absence degrades to evergreen creative patterns.

## S2-04 Context builder

Assemble a bounded, deterministic planning context from project objective, eligible shots, transcripts, profile, DNA, trends, rights, locks, and budget.

Acceptance:

- Token/byte budget and deterministic truncation are tested.
- Only authorized project assets are addressable.
- Context manifests are hashed and reproducible without storing raw secrets.

## S2-05 AI gateway

Implement schema validation, prompt/version registry, capability routing, timeout, retry, fallback, budget, redaction, usage metering, and fake responses.

Acceptance:

- Invalid model JSON never reaches domain state.
- Retry cannot multiply billing beyond configured limits.
- Prompt, model, schema, context hash, and evaluation result are traceable.

## S2-06 Direction generation

Generate exactly three distinct directions containing hook, narrative, shot rationale, pacing, caption approach, CTA, trend evidence, confidence, and risk flags.

Acceptance:

- Directions cite available shots and never fabricate asset facts.
- Near-duplicate directions fail diversity checks.
- User can select, regenerate, or lock fields.

## S2-07 Story and EDL generation

Produce EDL V1 using supported recipe tokens only, with 15–30 second duration and optional `force30Seconds`.

Acceptance:

- All source ranges exist, captions fit safe zones, transitions are supported, and duration is frame-accurate.
- Rights-unknown audio is never embedded.
- Validation returns actionable field errors and one bounded repair attempt.

## S2-08 Creative versioning and locks

Implement immutable versions, parent lineage, compare, user locks, regenerate-unlocked-fields, and optimistic concurrency.

Acceptance:

- Rendering freezes a version; subsequent edits fork.
- Concurrent edits return conflict details.
- Regeneration preserves all locked fields byte-for-byte.

## S2-09 Planning UX

Build direction cards, evidence drawer, confidence/risk labels, version history, locks, comparison, and recovery states.

Acceptance:

- AI-generated and creator-authored decisions are visibly distinguishable.
- Users can proceed without accepting trend suggestions.
- Mobile flow requires no precision drag interaction.

## S2-10 Evaluation and handoff

Run golden planning cases, hallucination/grounding checks, schema and diversity gates, cost budgets, staging E2E, and update traceability/memory.

Dependencies: S2-01/S2-02/S2-03 → S2-04 → S2-05 → S2-06 → S2-07 → S2-08/S2-09 → S2-10.

Exit: fake mode and one configured provider produce three grounded directions and a valid immutable EDL, with evaluation evidence and no unsupported render primitive.
