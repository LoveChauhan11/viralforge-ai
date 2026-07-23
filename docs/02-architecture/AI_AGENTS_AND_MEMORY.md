# AI Agents and Context Memory

## Principle

Agents propose typed decisions; deterministic services execute them. Models receive no direct database, shell, storage, or publishing authority. An orchestrator exposes bounded tools and validates output.

## Agents

**Trend Hunter** returns ranked hypotheses for hooks, pacing, transitions, and audio with freshness, provenance, and confidence.

**Media Analyst** consumes shots, transcripts, motion, exposure, sharpness, faces/objects, orientation, and safety facts. It adds semantic labels and candidate moments without mutating media.

**Clip Selector** returns eligible asset IDs, exact in/out timestamps, crop subject, ranking rationale, risks, and fallbacks.

**Story Builder** creates hook, setup, escalation, payoff, and CTA within a strict duration budget.

**Edit Director** returns the Edit Decision List: ordered shots, timing, speed, crop, supported transitions, overlays, captions, audio envelope, and safe zones.

**SEO Agent** returns title, description, hashtags, keywords, and pinned-comment suggestion within runtime-resolved limits.

**Thumbnail Agent** selects a source frame and returns deterministic overlay/layout instructions.

**Performance Analyst** compares platform metrics to a suitable channel baseline and attributes evidence to creative variables without overstating causation.

**Learning Agent** proposes preference updates. A policy layer applies confidence, sample-size, decay, exploration, and reversibility rules.

## Creator DNA

Creator DNA contains separate record types:

- Declared profile: niche, audience, language, tone, brand, CTA, and boundaries.
- Asset facts: recurring subjects, locations, people, and quality patterns.
- Creative preferences: hooks, pacing, captions, transitions, and duration.
- Performance observations: variable, metric, baseline, sample size, confidence, and window.
- Rejected choices and manual corrections.
- Active experiments.
- Proven templates and expired hypotheses.

Every record has provenance, timestamp, scope, confidence, and expiry/decay behavior.

## Context assembly

Build each context pack in this order:

1. Hard product and safety constraints.
2. Project brief and user locks.
3. Eligible source-media facts.
4. Current trend snapshot.
5. Stable declared Creator DNA.
6. High-confidence learned preferences.
7. Relevant recent observations and active experiment.
8. Output schema and supported editing primitives.

Use vectors only for semantic matching of transcript/media examples. Use relational queries for constraints, provenance, and metrics.

## Learning policy

No stable preference from one Short. Compare against a rolling compatible baseline. Apply time decay to trends. Preserve exploration with controlled experiments. Treat explicit user edits as strong but reversible signals. Every update is inspectable and reversible. Do not optimize only for clicks.

## Model gateway

All calls pass through one gateway for model routing, JSON Schema validation, prompt/schema versioning, minimization, cost accounting, timeouts, fallback, deterministic test fixtures, and evaluation logs.

Provider keys are server-only. Development uses fake adapters so the repository boots with no API keys.

## Evaluation

Golden fixtures cover direction selection, clip ranges, story coherence, captions, metadata limits, unsupported primitives, and safe output. Prompt/model changes must pass offline evaluation. Online experiments require a hypothesis, cohort, primary metric, guardrails, and stop condition.
