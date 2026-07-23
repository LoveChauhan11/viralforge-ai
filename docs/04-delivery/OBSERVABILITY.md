# Observability (Sprint 0)

## Correlation

| Signal | Where |
|---|---|
| `requestId` | HTTP `x-request-id`; job/outbox envelope |
| `traceparent` | HTTP response header; job/outbox envelope |
| `jobId` / `workspaceId` | Span attributes + structured logs |

A foundation job should produce linked spans: `http.request` → `job.create` → `outbox.dispatch` → `job.process`.

## Metrics (local + OTel)

| Name | Type | Labels |
|---|---|---|
| `viralforge.job.duration_ms` | histogram | `job_type`, `outcome` |
| `viralforge.job.terminal` | counter | `job_type`, `outcome` |
| `viralforge.queue.depth` | histogram | `queue` |
| `viralforge.queue.oldest_age_ms` | histogram | `queue` |
| `viralforge.provider.calls` | counter | `provider`, `result` |

Local tests assert via `localMetrics` and `getFinishedSpans()` (InMemory exporters). Set `OTEL_EXPORTER_OTLP_ENDPOINT` in later environments to ship OTLP (exporter hook reserved).

## Log rules

Never log: secrets, OAuth/API keys, signed URL query strings, emails (unless product-required and audited), raw transcripts, host filesystem paths.

Use `sanitizeLogFields` / `createLogger` from `@viralforge/observability`.

## Suggested dashboards

1. **API** — request rate, 4xx/5xx, p95 latency, ready vs live.
2. **Async jobs** — queue depth/age by queue, terminal outcomes, duration p95, lease recoveries.
3. **Providers** — call volume and error rate by provider (budget anomalies).
4. **Storage** — put/head/delete errors (no URL bodies).

## Alert stubs (wire in Sprint 6 ops hardening)

| Alert | Signal | Priority |
|---|---|---|
| Queue stalled | `oldest_age_ms` > 15m sustained | P2 |
| Job failure spike | `job.terminal{outcome=failed}` rate | P2/P3 |
| API ready failing | ready probe down | P2 |
| Provider error burst | `provider.calls{result=error}` | P3 |
| Cross-tenant / auth anomaly | authz deny spike + audit | P1 review |

See also `docs/04-delivery/OPERATIONS.md` runbooks.
