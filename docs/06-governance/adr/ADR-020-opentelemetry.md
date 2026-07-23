# ADR-020 — OpenTelemetry-first observability

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-13

## Context

Sprint 0 requires correlated traces across web → API → outbox → worker, structured logs without secrets/signed URLs, and locally testable operational signals (job duration/failure, queue depth/age, provider usage).

## Decision

- **`@viralforge/observability`** owns logging, tracing, and metrics facades.
- Tracing uses **OpenTelemetry API + SDK** (`@opentelemetry/api`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-metrics`) with an **InMemory** exporter by default so tests need no collector.
- Optional OTLP HTTP export when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (staging/production later).
- Correlation: `requestId` (existing) + W3C **`traceparent`** propagated on HTTP responses and inside job/outbox envelopes.
- Log fields pass through **`sanitizeLogFields`** (redacts secrets, tokens, signed URL query strings, emails).
- Standard meters: `viralforge.job.duration_ms`, `viralforge.job.terminal`, `viralforge.queue.depth`, `viralforge.queue.oldest_age_ms`, `viralforge.provider.calls`.

## Alternatives

- Vendor APM-only SDKs — couples us early; OTel is the architecture baseline.
- Logs-only correlation — cannot prove a single distributed trace for the foundation flow.

## Consequences

- Services call `initTelemetry(serviceName)` at boot and `shutdownTelemetry()` on stop.
- Unit/integration tests assert spans and metric points via in-memory readers.
- Dashboards/alerts are documented in `docs/04-delivery/OBSERVABILITY.md`.

## Exit

Swap exporters without changing application instrumentation code.
