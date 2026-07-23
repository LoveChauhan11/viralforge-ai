# ADR-011 — Toolchain and package manager

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-01

## Context

Sprint 0 needs a deterministic monorepo foundation. Architecture specifies TypeScript, pnpm, Turborepo, Vitest, Playwright, and strict typing. Runtime and package-manager versions must be pinned so fresh checkouts and CI produce the same graph.

## Decision

| Tool | Pin | Reason |
|---|---|---|
| Node.js | `>=22.14.0 <25` | Current Active LTS line (22) plus Node 24; reject older runtimes with a clear engines error |
| pnpm | `9.15.9` via `packageManager` + Corepack | Deterministic installs; workspace-first; avoids npm workspaces drift |
| Turborepo | `2.x` | Task orchestration for build/lint/typecheck/test across apps and packages |
| TypeScript | `5.8.x` | Strict mode, project references friendly, maintained |
| ESLint | `9.x` flat config | Boundary and quality rules without legacy `.eslintrc` |
| Prettier | `3.x` | Opinionated formatting; no style debates in review |
| Vitest | `3.x` | Fast unit/integration tests; Vite-aligned |
| Playwright | `1.x` | Browser E2E; responsive checks from 360 px |

`engine-strict=true` in `.npmrc` fails unsupported Node versions during install. Root scripts call a small engines check for clearer messages outside pnpm.

## Alternatives considered

- **npm/yarn workspaces** — weaker peer dependency handling for a polyrepo-style monorepo; rejected.
- **Nx** — heavier than needed for modular monolith; Turborepo is sufficient.
- **Node 20 only** — still supported but older; allow 22+ to match current developer machines.

## Consequences

- Contributors must use Corepack (`corepack enable`) or install the pinned pnpm.
- CI images must ship Node 22 or 24 and enable Corepack.
- Lockfile (`pnpm-lock.yaml`) is mandatory and reviewed on dependency changes.

## Exit / migration

Bump pins via a dedicated ADR amendment and coordinated CI/image updates. Never leave `packageManager` and CI Node versions out of sync.
