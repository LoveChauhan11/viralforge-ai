# Sprint 5 — Analytics, Experiments, and Creator Learning

Goal: published performance becomes explainable insight and conservative, reversible Creator DNA proposals.

## S5-01 Analytics authorization and sync

Request only necessary analytics consent, implement scheduled and manual sync, incremental windows, quota budgets, backfill, and token failure recovery.

Acceptance:

- Missing analytics scope does not break publishing.
- Sync cursor prevents gaps and duplicate logical snapshots.
- Provider values retain capture time and source definition.

## S5-02 Metric normalization

Persist append-only publication snapshots and retention points with unavailable/null semantics, schema version, and raw-reference lineage.

Acceptance:

- Zero is never substituted for unavailable data.
- Metric definition changes are versioned.
- Late provider corrections append/reconcile without rewriting audit history.

## S5-03 Insight dashboard

Build mobile-first overview, publication detail, retention curve, baseline comparison, date filters, freshness, confidence, and no-data states.

Acceptance:

- Metrics show timezone, window, and last-sync time.
- Small samples carry a visible warning.
- Charts have keyboard/table alternatives and accessible descriptions.

## S5-04 Creator baseline

Calculate robust baseline by niche/profile and comparable duration/window, with minimum sample size and outlier handling.

Acceptance:

- Baseline excludes deleted, incomplete, and non-comparable records.
- Versioned formulas reproduce historical results.
- No cross-workspace raw data is exposed.

## S5-05 Insight narrative

Generate evidence-grounded summaries and recommended next tests from normalized facts only.

Acceptance:

- Every claim links to metric IDs/window and includes confidence.
- Causal language is prohibited unless experiment evidence supports it.
- Fake model mode returns deterministic template narratives.

## S5-06 Experiment records

Implement hypothesis, variable, control/variant, primary metric, guardrails, sample target, dates, state, and outcome.

Acceptance:

- Only one primary variable changes per simple experiment.
- Insufficient sample cannot be marked conclusive automatically.
- Creator can stop an experiment without deleting evidence.

## S5-07 Learning proposal engine

Propose DNA changes using minimum evidence, recency weighting, confidence, counter-evidence, expected benefit, and rollback rule.

Acceptance:

- A single publication cannot auto-change DNA.
- User-locked and safety-related fields are never auto-updated.
- Every proposal identifies supporting publications and formula version.

## S5-08 Policy apply and revert

Implement `proposed → rejected | approved → applied → reverted | expired`, with default human approval and optional low-risk policy flag kept off in MVP.

Acceptance:

- Apply is atomic, versioned, auditable, and idempotent.
- Revert restores the exact prior record.
- Future context builders use only active, non-expired DNA.

## S5-09 Cost and data controls

Meter provider calls, analytics quota, storage, retention, and per-workspace budgets; implement export/delete interaction with analytics and learning lineage.

Acceptance:

- Budget exhaustion degrades nonessential narrative generation first.
- Deleting a publication removes personal derivatives while retaining allowed aggregate audit evidence.
- Operator views do not expose raw creator content.

## S5-10 Evaluation and handoff

Run metric fixtures, DST/window tests, insight grounding evaluation, learning false-positive suite, accessibility, staging sync, traceability, and memory update.

Dependencies: S5-01 → S5-02 → S5-03/S5-04 → S5-05; S5-06 → S5-07 → S5-08; S5-09 spans; S5-10 closes.

Exit: a published test video syncs metrics, renders an inspectable recommendation, and creates only a policy-valid, human-approved, reversible DNA update.
