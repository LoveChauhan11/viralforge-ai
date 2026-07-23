# ADR-013 — Drizzle ORM for PostgreSQL

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-05

## Context

Sprint 0 needs typed schema, SQL migrations, and tenant-scoped queries. Architecture allows Prisma or Drizzle. We need migrations that preserve the names/invariants in `DATABASE_SCHEMA_SPECIFICATION.md`.

## Decision

Use **Drizzle ORM** with `drizzle-kit` migrations against PostgreSQL.

Reasons:

- SQL-first schema closer to the authoritative catalogue.
- Lightweight runtime suitable for API and workers.
- Explicit query builder encourages `workspace_id` predicates.
- Easy to keep domain packages free of ORM imports (repositories live in `@viralforge/database`).

## Alternatives

- **Prisma** — excellent DX and migrations; heavier client and more opaque SQL for outbox/lease queries.
- **Raw `pg` / Knex** — more boilerplate for typed models.

## Consequences

- `@viralforge/database` owns schema, migrations, and repository helpers.
- Domain packages receive plain types/DTOs, not Drizzle table objects.
- Integration tests require Postgres (`pnpm infra:up`).

## Exit

A future Prisma migration would require a dual-write or cutover ADR; prefer staying on Drizzle unless a blocking limitation appears.
