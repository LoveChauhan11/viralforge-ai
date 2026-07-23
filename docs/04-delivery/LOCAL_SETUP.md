# Local setup

Fresh checkout boots without paid credentials.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22.14+ (supported through 24.x; `<25`) |
| pnpm | 9.15.9 (`corepack prepare pnpm@9.15.9 --activate` or `npx pnpm@9.15.9`) |
| Docker Desktop | Required for Postgres, Redis, MinIO |

## Boot sequence

```bash
# 1. Install
npx pnpm@9.15.9 install

# 2. Environment
cp .env.example .env

# 3. Infra
npx pnpm@9.15.9 infra:up

# 4. Schema + seed
npx pnpm@9.15.9 migrate
npx pnpm@9.15.9 seed

# 5. Quality gate (optional but recommended)
npx pnpm@9.15.9 lint
npx pnpm@9.15.9 typecheck
npx pnpm@9.15.9 test

# 6. Run services (separate terminals or turbo)
npx pnpm@9.15.9 --filter @viralforge/api dev
npx pnpm@9.15.9 --filter @viralforge/scheduler dev
npx pnpm@9.15.9 --filter @viralforge/worker-general dev
npx pnpm@9.15.9 --filter @viralforge/web dev
```

Default local providers are fakes (`AI_PROVIDER=fake`, etc.). No paid keys are required.

Seed identity (local only): email `local.dev@example.invalid`. User/workspace IDs are printed by `pnpm seed`.

## Useful URLs

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API live | http://localhost:3001/health/live |
| API ready | http://localhost:3001/health/ready |
| MinIO console | http://localhost:9001 |

Exact ports follow `.env.example`.

## Root commands

| Script | Purpose |
|---|---|
| `dev` / `build` / `lint` / `typecheck` / `test` / `test:e2e` | Workspace quality |
| `migrate` / `seed` | Database |
| `infra:up` / `infra:down` / `infra:reset` | Local Docker deps (`reset` warns before wipe) |
| `docker:build` | Multi-target images |
| `format` / `format:check` | Prettier |
| `check:migration-drift` | Fail if Drizzle SQL drifts from schema |
| `check:contract-drift` | Build `@viralforge/contracts` |

## Foundation vertical slice

1. Sign in via the web local session flow.
2. Open **Create** and submit a foundation job (idempotency key supported).
3. Observe progress → terminal state via API/UI.
4. Refresh/retry must not create a duplicate logical job.

## Reset

```bash
npx pnpm@9.15.9 infra:reset   # destroys local volumes after confirmation
npx pnpm@9.15.9 migrate
npx pnpm@9.15.9 seed
```

## Troubleshooting

See [OPERATIONS.md](./OPERATIONS.md#local-troubleshooting).
