# Definition of Done

“Done” means the behavior is demonstrably usable, secure, operable, and recoverable—not merely that files exist.

## Item-level done

- Acceptance criteria are satisfied and linked to automated tests where practical.
- Code is reviewed, typed, linted, tested, documented, and contains no hidden critical TODO.
- Authorization, tenancy, validation, idempotency, retries, timeouts, cancellation, and failure states are handled where relevant.
- Logs, traces, metrics, alerts, and runbook implications are addressed.
- Environment variables, migrations, public contracts, cost, security/privacy, retention, and rights implications are documented.
- Responsive and accessibility behavior is verified for affected UI.
- Fake adapters and synthetic fixtures cover automated tests.

## Sprint-level release gate

- Fresh clone and clean install succeed using pinned versions and lockfile.
- One documented command starts dependencies and services locally.
- Migrate/seed are repeatable; schema drift is checked.
- Required root scripts pass.
- Workspace A cannot read or mutate Workspace B through API, jobs, or storage.
- Duplicate sample requests create one logical job/result.
- Worker termination and lease recovery do not duplicate terminal effects.
- Fake-provider mode works with no external credentials.
- Web is verified at 360, 768, and 1440 px with core accessibility checks.
- Health endpoints behave correctly during dependency failure and shutdown.
- Production images build and run as non-root.
- Railway staging is healthy with migrations applied once.
- Secret, dependency, static, and container scans meet policy.
- No private sample media, copyrighted music, credentials, or production data are in git.
- Traceability, ADRs, risks, environment matrix, operations docs, and handoff are current.

## Required handoff evidence

Record:

- Scope and backlog IDs completed.
- End-to-end behavior demonstrated.
- Commands run and test results.
- Migrations and compatibility impact.
- Deployment/service health.
- Observability evidence.
- Security/privacy/rights review.
- Cost changes.
- Remaining risks, owners, and dates.
- Exact next-sprint entry criteria.

Any unchecked release gate must be declared with owner, impact, mitigation, and explicit acceptance; critical security, tenant-isolation, data-loss, or rights risks cannot be waived.
