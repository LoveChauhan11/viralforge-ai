# ADR-022 — CI provider and supply-chain gates

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-15

## Context

Sprint 0 requires automated gates so pull requests cannot merge with failing quality, secret, dependency, migration/contract drift, or container build checks. Tests must use fake adapters and synthetic fixtures only.

## Decision

- **CI provider:** GitHub Actions (`.github/workflows/`).
- **Required PR jobs** (branch protection must require these names):
  - `quality` — install, lint, typecheck, unit/integration tests, format check, migration drift, contract package build smoke
  - `secrets` — Gitleaks secret scan
  - `containers` — Docker build of `api`, `migrate`, `web`, `worker-general`
  - `analyze` — CodeQL JavaScript/TypeScript (SARIF)
  - `dependency-review` — GitHub Dependency Review on pull requests
- **Container scan:** Trivy filesystem/image scan on the `api` image (HIGH/CRITICAL fail).
- **Severity policy:** documented in `docs/04-delivery/CI_AND_SUPPLY_CHAIN.md`.
- CI env forces fake providers (`AI_PROVIDER=fake`, etc.) and never injects paid credentials.
- Postgres service container supplies `DATABASE_URL` for integration tests; Redis optional for queue unit tests.

## Alternatives

- GitLab CI / CircleCI — extra vendor; GitHub already hosts the repo.
- Skip container builds in PR — fails backlog acceptance.

## Consequences

- Maintainers must enable branch protection requiring the job names above.
- Gitleaks allowlist changes need security review.
- Full worker-media image builds (FFmpeg) may be nightly later to keep PR latency bounded; PR still builds general worker + api/web/migrate.

## Exit

Swap scanners behind the same required check names; keep fake-only CI policy.
