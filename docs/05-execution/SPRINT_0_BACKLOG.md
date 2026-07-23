# Sprint 0 — Executable Foundation Backlog

Sprint goal: a fresh checkout boots locally without paid credentials and proves one secure, tenant-isolated, idempotent asynchronous vertical flow from web to API to database/outbox to worker to persisted result.

Each item must be implemented, tested, documented, and committed with its ID.

## S0-01 Repository and toolchain

Create the pnpm workspace, strict TypeScript configuration, formatting/linting, test runners, build orchestration, pinned runtime/package-manager versions, and root scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `migrate`, `seed`.

Acceptance:

- Fresh install is deterministic from the lockfile.
- Unsupported runtime versions fail with a useful message.
- Root commands cover all workspaces and return non-zero on failure.

## S0-02 Application boundaries

Create deployable entrypoints for web, API, general worker, media worker, and scheduler/outbox dispatcher, plus shared domain, contracts, config, observability, database, queue, storage, and provider packages.

Acceptance:

- Domain packages do not import framework or provider implementations.
- Each service has independent startup, health, and shutdown behavior.
- Dependency direction is enforced by lint/test rules.

## S0-03 Local infrastructure

Add one-command local startup for PostgreSQL, Redis, and S3-compatible object storage, with health checks and persistent development volumes.

Acceptance:

- Local dependencies start without external accounts.
- Readiness waits for dependencies rather than racing them.
- Local reset is documented and warns before removing data.

## S0-04 Configuration and secrets

Implement schema-validated configuration per service and provider selection with safe fake defaults.

Acceptance:

- Missing required production variables stop startup with redacted errors.
- Fake mode boots with no paid-provider credentials.
- Secrets never appear in logs or client bundles.

## S0-05 Database, tenancy, and migrations

Create baseline models and migrations for user, workspace, workspace member, job, job attempt/progress, outbox event, audit event, and object reference.

Acceptance:

- Migration and seed are repeatable.
- All tenant-owned rows carry workspace identity and indexed access paths.
- Integration tests prove Workspace A cannot access or mutate Workspace B.
- Database constraints enforce critical invariants.

## S0-06 Auth and authorization

Create an auth interface, safe local implementation, request principal, workspace resolution, and centralized authorization guards.

Acceptance:

- Unauthenticated, unauthorized, and cross-tenant requests are distinct.
- Local identities cannot be enabled accidentally in production.
- Audit events capture sensitive authorization decisions without personal payloads.

## S0-07 API platform

Implement request IDs, structured problem-details errors, validation, pagination conventions, rate-limit hooks, health/live/ready endpoints, structured logging, and graceful shutdown.

Acceptance:

- Invalid input never reaches domain handlers.
- Request ID propagates into jobs, logs, and traces.
- Readiness fails when mandatory dependencies are unavailable; liveness remains meaningful.

## S0-08 Queue and transactional outbox

Implement BullMQ queues, typed job envelopes, outbox claiming/dispatch, retry policy, dead-letter handling, leases/heartbeats, and idempotency keys.

Acceptance:

- Database write and outbox record commit atomically.
- Duplicate dispatches and duplicate requests create one logical result.
- A killed worker can be recovered without losing work or duplicating the result.

## S0-09 Sample vertical flow

Build an authenticated “foundation job” flow: web submits once, API persists job/outbox, dispatcher enqueues, worker reports progress, result persists, and web observes terminal state.

Acceptance:

- Works end to end with fake providers.
- Refresh/retry does not duplicate the job.
- Failure, retry, cancellation, timeout, and terminal states are visible and tested.

## S0-10 Web shell and design foundation

Build mobile-first navigation and routes for Today, Create, Insights, Library, and Settings, with accessible tokens/components, authenticated shell, empty/loading/error states, and responsive layout.

Acceptance:

- Verified at 360, 768, and 1440 px.
- Keyboard navigation, focus, labels, contrast, reduced motion, and error announcements are covered.
- No screen bypasses server authorization.

## S0-11 Object storage

Create object-storage interfaces, local S3-compatible adapter, scoped key strategy, signed URL service, metadata persistence, and deletion hooks.

Acceptance:

- No durable binary depends on application local disk.
- Cross-tenant keys/URLs are rejected.
- Signed URLs expire and are never logged.
- Cleanup is safe and idempotent.

## S0-12 Provider contracts

Create model, transcription, trend, YouTube, and notification interfaces with fake adapters, timeouts, normalized errors, budgets, and capability metadata.

Acceptance:

- Tests never call paid/external services.
- Provider failures degrade without corrupting workflow state.
- Inputs/outputs are schema-validated and sensitive fields are redacted.

## S0-13 Observability

Wire structured logs, OpenTelemetry traces/metrics, service/job correlation, queue depth/age, job duration/failure, provider usage, and health dashboards/alerts documentation.

Acceptance:

- One trace follows the sample flow across web/API/outbox/worker.
- Logs contain identifiers and state transitions but no secrets or signed URLs.
- Required operational signals are testable locally.

## S0-14 Containers and Railway

Create production multi-stage images and Railway definitions for web, API, workers, and dispatcher/scheduler, using managed PostgreSQL/Redis and external object storage.

Acceptance:

- Images run as non-root, expose health checks, shut down gracefully, and contain required FFmpeg runtime only where needed.
- Migrations run once as a release/pre-deploy action, not on every replica.
- No service assumes durable local disk.

## S0-15 CI and supply-chain gates

Add CI for install, lint, typecheck, tests, migration checks, container builds, secret scanning, dependency review, static analysis, and generated-contract drift.

Acceptance:

- Pull requests cannot pass with a failing required gate.
- CI uses fake adapters and synthetic fixtures only.
- Dependency and secret findings have documented severity policy.

## S0-16 Documentation and handoff

Update local setup, commands, provider-extension guide, deployment steps, troubleshooting, ADRs, environment matrix, traceability, risk register, and Sprint 0 evidence.

Acceptance:

- A new engineer can boot the stack from a clean checkout.
- Every Sprint 0 requirement links to implementation and automated evidence.
- Remaining risks and Sprint 1 entry criteria are explicit.

## Dependency order

1. S0-01 → S0-02 → S0-03/S0-04
2. S0-05 → S0-06/S0-07
3. S0-08 → S0-09
4. S0-10/S0-11/S0-12/S0-13 may proceed after their shared foundations
5. S0-14/S0-15 → S0-16

Sprint 0 is not complete until `DEFINITION_OF_DONE.md` is fully evidenced.
