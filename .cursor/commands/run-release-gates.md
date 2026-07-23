# Command: Run Release Gates

Input: sprint number and target environment.

1. Pin commit/environment and verify migrations/config.
2. Run install, lint, format check, typecheck, unit, integration, contracts, E2E, golden evals, security/supply-chain scans, build/container, and sprint-specific media/load/resilience tests.
3. Deploy/smoke staging when required; capture logs/metrics without secrets.
4. Map results to every sprint acceptance item and Definition of Done.
5. Report counts, failures, skipped tests with reason, evidence, unresolved risks and go/no-go. A skipped P0 is a failure.
