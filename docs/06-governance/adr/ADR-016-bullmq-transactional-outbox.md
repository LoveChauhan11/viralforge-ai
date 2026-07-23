# ADR-016 — BullMQ execution with transactional outbox

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-08

## Context

Architecture requires PostgreSQL as source of truth and Redis/BullMQ for job execution. Writes that enqueue work must not lose events if the process crashes after commit but before queue publish.

## Decision

1. Persist `outbox_events` in the **same Postgres transaction** as the business write (e.g. job insert).
2. `apps/scheduler` runs an outbox dispatcher that **claims** unpublished rows (`claim_owner`, `claim_expires_at`), publishes to BullMQ, then sets `published_at`.
3. BullMQ job id = outbox event id (or deterministic hash) so duplicate publishes are idempotent at the queue layer.
4. Workers use job leases/heartbeats on the `jobs` row; crashed workers allow reclaim after lease expiry without duplicating terminal results (check job state before side effects).
5. Retry/backoff via BullMQ attempts; exhausted jobs → dead-letter queue `viralforge-dlq` with safe error metadata.

Local Redis from `pnpm infra:up`. Fake in-memory publisher remains for unit tests without Redis.

## Alternatives

- Enqueue inside the API request — loses atomicity with DB.
- ONLY outbox polling without BullMQ — weaker worker ecosystem.

## Consequences

- Redis loss is recoverable by re-dispatching unpublished/claimed-expired outbox rows.
- Scheduler is a required process in local `pnpm dev`.

## Exit

Swap queue backend only behind `QueuePublisher` / worker consumer interfaces.
