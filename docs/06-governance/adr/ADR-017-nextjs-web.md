# ADR-017 — Next.js App Router for web

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-10

## Context

System architecture and the Sprint 0 roadmap specify a Next.js responsive web app. `apps/web` was a temporary `@viralforge/service-kit` health process until the design shell landed.

## Decision

- **`apps/web` uses Next.js (App Router)** with React Server Components by default.
- Primary nav routes: `/today`, `/create`, `/insights`, `/library`, `/settings` (root redirects to `/today`).
- Browser calls the API via **same-origin rewrites** (`/v1/*` → API) so local auth headers work without CORS during Sprint 0.
- Design tokens and shared presentational components live in `@viralforge/ui` (React peer dependency).
- Local development identity uses the existing `x-viralforge-user-id` header (ADR-014), stored in an httpOnly-capable cookie set from Settings for demos.
- Playwright verifies shell layout at 360, 768, and 1440 px.

## Alternatives

- Keep a custom Node static server — rejects architecture baseline.
- Pages Router — older; App Router is the current Next.js default.
- Direct browser→API with CORS — more moving parts for local auth; rewrites first.

## Consequences

- Web build outputs `.next/`; Turbo already allows that output path.
- Workers must not import `@viralforge/ui` or Next.
- Foundation job submit/observe UI ships on Create to close the S0-09 browser path.

## Exit

Swap rewrite for an authenticated BFF or CORS+cookie session without changing route IA.
