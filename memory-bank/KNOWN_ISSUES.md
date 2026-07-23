# Known Issues and Risks

Updated: 2026-07-23 UTC

| ID | Severity | Issue | Status/owner |
|---|---|---|---|
| PRE-02 | Medium | Repository is public and has no explicit licence. | Owner |
| S0-IMG | Low | Runtime images copy full monorepo (~1.5GB; media ~2.2GB). Shrink with `pnpm deploy` later. | Platform |
| PRE-03 / R-15 | Medium | Railway project not provisioned yet; configs exist under `infra/railway/`. | Platform |
| R-16 | Low | Error-tracking vendor ADR deferred; OTel/logs only. | Platform |
| R-17 | Medium | Branch protection must require CI job names after first Actions run. | Maintainer |

Add reproducible defects with impact, environment/commit, steps, expected/actual, evidence, owner, and status. Never store secrets or private media references.
