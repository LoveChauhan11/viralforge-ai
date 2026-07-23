# Sprint 6 — Production Hardening and Launch

Goal: prove security, reliability, operability, accessibility, privacy, cost control, and reversible production rollout.

## S6-01 End-to-end regression

Automate critical journeys from onboarding through upload, planning, rendering, approval, publication, analytics, learning, export, and deletion.

Acceptance:

- Catalogue P0/P1 tests pass in CI/staging with synthetic data.
- Provider-dependent tests use contract fakes; designated live smoke tests are isolated.
- Evidence links commit, environment, time, and artifact.

## S6-02 Performance and capacity

Run API load, multipart concurrency, queue burst, render soak, large asset, scheduler, and database/storage capacity tests.

Acceptance:

- Published SLOs and per-workspace fairness limits are met.
- Bottlenecks have owners and capacity thresholds.
- Autoscaling cannot exceed cost guardrails silently.

## S6-03 Resilience and disaster recovery

Test worker death, dependency outage, network partition, poison messages, corrupt objects, restore from backup, and regional/provider recovery.

Acceptance:

- RPO/RTO targets are evidenced in a restore drill.
- Outbox/queue reconciliation loses no accepted command.
- Runbooks identify safe rollback and communication steps.

## S6-04 Security verification

Complete threat-model closure, tenant isolation, authorization matrix tests, OAuth review, secret scan, SAST/dependency/container scan, rate limits, and penetration test plan.

Acceptance:

- No open Critical/High launch finding.
- Security-sensitive logs and audit events are validated.
- Abuse and resource-exhaustion controls are enabled.

## S6-05 Privacy and lifecycle

Implement and verify workspace export, deletion, account closure, retention, backup expiry, legal hold, consent records, and deletion evidence.

Acceptance:

- Export is complete, portable, authorized, time-limited, and audited.
- Deletion follows documented dependency order and is idempotent.
- Restore cannot resurrect data whose backup-retention window has expired.

## S6-06 Accessibility and device matrix

Complete WCAG 2.2 AA review across 360/390/768/1024/1440 widths, keyboard, screen readers, zoom, reduced motion, high contrast, and touch targets.

Acceptance:

- No P0/P1 accessibility defect remains.
- Media controls, charts, progress, dialogs, and drag alternatives are covered.
- Supported browser/device matrix is published.

## S6-07 Operations and support

Finish dashboards, alerts, SLOs, incident severity, on-call, queue/provider runbooks, audited support actions, status communication, and data-access procedure.

Acceptance:

- Game-day responders diagnose injected failures using documented signals.
- Support cannot impersonate or access media by default.
- Every privileged action is time-bounded and audited.

## S6-08 Quotas, flags, and abuse controls

Enforce upload/storage/render/AI/publish quotas, reservations, rate limits, feature flags, kill switches, and provider circuit breakers.

Acceptance:

- Limits are server-authoritative and race-safe.
- Disabling a provider does not corrupt in-flight state.
- Workspace overrides require audited owner/admin authorization.

## S6-09 Release engineering

Implement production deployment, migration expand/contract checks, canary/percentage rollout, smoke tests, rollback, release notes, and change approval.

Acceptance:

- Database changes are backward compatible during rollout.
- Previous version can be restored within target time.
- Public publishing remains feature-flagged until owner sign-off.

## S6-10 Launch readiness and handoff

Close traceability, risks, costs, licences, policies, incident contacts, backups, production config, owner decisions, and post-launch monitoring plan.

Acceptance:

- Every MVP requirement has implementation and test evidence.
- All secrets and production integrations have named owners and rotation dates.
- Go/no-go checklist is signed; unresolved items have explicit risk acceptance.

Dependencies: S6-01 through S6-08 produce evidence; S6-09 exercises it; S6-10 is the final gate.

Exit: canary production deployment meets SLO/security/privacy/accessibility gates, restores successfully, rolls back safely, and can be operated without implementation-agent context.
