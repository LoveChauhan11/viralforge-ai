# ADR-015 — Fastify for the HTTP API

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-07

## Context

System architecture specifies Fastify for the API. Sprint 0 previously used a minimal Node HTTP runtime (`@viralforge/service-kit`) shared with workers. S0-07 requires request IDs, problem-details errors, input validation, pagination conventions, rate-limit hooks, and dependency-aware readiness — Fastify fits these cleanly without reinventing a router.

## Decision

- **`apps/api` uses Fastify** as the HTTP framework.
- Workers/scheduler continue on `@viralforge/service-kit` (health + graceful shutdown only).
- Errors are mapped to RFC 7807-style problem details (`application/problem+json`) via a central error handler.
- Request IDs: honor inbound `x-request-id` or generate UUIDv4; echo on response and attach to logs.
- Validation uses Zod before domain/auth handlers run.
- Rate limiting is hooked as a Fastify `onRequest` stub (no Redis limiter until S0-08/quotas); interface is ready for Redis-backed limits.
- Readiness probes PostgreSQL (`SELECT 1`); liveness remains process-only.

## Alternatives

- Keep raw Node HTTP — more custom code for plugins/validation.
- Express/Hono — deviate from architecture baseline.

## Consequences

- API depends on `fastify` (+ zod). Auth/domain packages stay framework-free.
- Integration tests boot the Fastify app (inject or listen).
- OpenAPI generation can attach later without changing route contracts.

## Exit

If Fastify becomes a liability, replace behind the same route/problem-details contracts; workers remain unaffected.
