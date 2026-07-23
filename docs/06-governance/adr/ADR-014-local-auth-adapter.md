# ADR-014 — Local development authentication adapter

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-06

## Context

Sprint 0 needs an auth abstraction and a safe local implementation so developers and CI can exercise tenant-scoped APIs without OIDC. Production must never accept local identity spoofing.

## Decision

1. Define `@viralforge/auth` with `AuthProvider`, `Principal`, workspace membership resolution, and centralized `authorize()` guards.
2. Ship a **local adapter** that authenticates via header `x-viralforge-user-id` (UUID of an existing user). No passwords; intended for `APP_ENV=local|test|ci` only.
3. Construction of the local adapter **throws** when `AUTH_PROVIDER=local` and `APP_ENV` is `staging` or `production` (defense in depth beyond config startup guards).
4. Authorization failures map to distinct outcomes: unauthenticated → 401, insufficient role → 403, missing/cross-tenant workspace membership → 404 (non-discoverable).
5. Sensitive authz decisions write `audit_events` with actor/workspace/action/decision only — never email, tokens, or IP plaintext.

OIDC/session cookies arrive in a later sprint; the interface stays stable.

## Alternatives

- Shared secret Bearer tokens — still spoofable locally and more ceremony.
- Always-on mock user — hides unauthenticated paths.
- Real OIDC in Sprint 0 — blocks local/CI without credentials.

## Consequences

- API and workers depend on `@viralforge/auth` interfaces; only the API process constructs the local adapter.
- Clients in local mode must send `x-viralforge-user-id` matching a seeded/created user.
- Production deploys must set `AUTH_PROVIDER=oidc` (enforced by config + adapter).

## Exit

Replace local header auth with signed sessions/OIDC behind the same `AuthProvider` interface; delete local adapter from production images if desired.
