# Contributing

## Before coding

1. Read `AGENTS.md`, `README.md`, and the relevant architecture/product documents.
2. Select a backlog item with explicit acceptance criteria.
3. Confirm dependencies and create an ADR for any material unresolved choice.
4. Branch from an up-to-date `main`.

## Change rules

- Keep one coherent concern per pull request.
- Reference backlog and requirement IDs in commits and pull requests.
- Include tests, telemetry, failure handling, authorization, and documentation with the implementation.
- Use fake adapters in automated tests; external credentials must not be required.
- Do not introduce durable Railway local-disk storage.
- Do not commit private user media, production data, generated renders, secrets, or licensed music.
- Schema changes require migrations and rollback/forward-recovery notes.
- API changes require contract and compatibility updates.

## Required checks

Once Sprint 0 creates the scripts, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Also verify migrations, tenancy isolation, idempotency, worker recovery, fake-provider mode, and responsive layouts when affected.

## Pull requests

Use the repository template. Include what changed, why, evidence, migrations, environment changes, security/privacy impact, cost impact, risks, and rollback or forward-fix strategy.

Do not merge with unresolved high-severity security findings, failing required checks, undocumented environment variables, or incomplete acceptance criteria.
