# CI and supply-chain policy

## Required checks (branch protection)

Configure GitHub branch protection on `main` so PRs cannot merge unless these succeed:

| Check name | Purpose |
|---|---|
| `quality` | Lint, typecheck, tests, format, migration drift |
| `secrets` | Gitleaks secret scan |
| `containers` | Docker build (+ Trivy on api image) |
| `analyze` | CodeQL |
| `dependency-review` | Dependency Review Action (PRs only) |

## Fake-only CI

CI must not require paid API keys. Default:

- `APP_ENV=test`
- `AI_PROVIDER=fake`
- `TRANSCRIPTION_PROVIDER=fake`
- `TREND_PROVIDER=manual`
- `NOTIFICATION_PROVIDER=fake`
- `AUTH_PROVIDER=local` (test only)

Synthetic fixtures only — never private media or production dumps.

## Severity policy

### Secrets (Gitleaks)

| Finding | Action |
|---|---|
| Any confirmed secret in tracked files | **Block merge**; rotate immediately; purge from history if committed |
| False positive | Allowlist via `.gitleaks.toml` with justification comment; security owner ack |

### Dependencies (Dependency Review / advisories)

| Severity | Action |
|---|---|
| Critical / High (reachable) | **Block merge** until upgraded or waived with documented risk + expiry |
| Medium | Fix in same sprint or file risk with owner |
| Low / informational | Track; no merge block |

### Containers (Trivy)

| Severity | Action |
|---|---|
| Critical / High in final image | **Block merge** unless base-image bump planned same PR |
| Medium / Low | Track; prefer fix when updating Node/OS base |

### CodeQL / SAST

| Severity | Action |
|---|---|
| Error / High security | **Block merge** |
| Warning | Fix or document waiver in PR |

## Migration and contract drift

- `pnpm check:migration-drift` regenerates Drizzle SQL from schema and fails if `packages/database/drizzle` changes.
- Contract packages must build (`@viralforge/contracts`); schema-validated Zod contracts live in source — no unpaid OpenAPI generator yet.

## Local equivalents

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check
pnpm check:migration-drift
pnpm docker:build api migrate web worker-general
```
