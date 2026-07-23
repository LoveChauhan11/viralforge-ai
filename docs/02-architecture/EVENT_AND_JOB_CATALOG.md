# Event and Background-Job Catalogue

All accepted asynchronous commands persist a domain change plus outbox event in one transaction. Envelopes are schema-validated and carry IDs, never media bytes or secrets.

## Envelope

```json
{
  "eventId": "019...",
  "eventType": "asset.uploadCompleted.v1",
  "occurredAt": "2026-07-23T10:00:00Z",
  "workspaceId": "019...",
  "aggregate": {"type": "asset", "id": "019...", "version": 1},
  "requestId": "req_...",
  "actorId": "019...",
  "correlationId": "019...",
  "causationId": "019...",
  "payload": {"assetId": "019..."}
}
```

Consumers must re-read authoritative state and verify workspace ownership. Dedupe by event ID and logical result key.

## Domain events

| Event | Producer | Consumers | Minimal payload |
|---|---|---|---|
| `asset.uploadCompleted.v1` | API | media orchestrator | assetId |
| `asset.validated.v1` | media worker | derivative/analyze scheduler | assetId, probeVersion |
| `asset.ready.v1` | media orchestrator | project service, SSE | assetId |
| `asset.rejected.v1` | media worker | SSE/cleanup | assetId, safeErrorCode |
| `asset.deleteRequested.v1` | API | cleanup worker | assetId |
| `project.directionRequested.v1` | API | AI worker | projectId, requestVersion |
| `creative.versionRequested.v1` | API | AI worker | projectId, directionRef |
| `creative.versionCreated.v1` | AI worker | SSE | projectId, creativeVersionId |
| `render.requested.v1` | API | media queue router | renderId, kind |
| `render.ready.v1` | media worker | SSE/publication service | renderId, qcVersion |
| `render.failed.v1` | media worker | SSE/operations | renderId, safeErrorCode |
| `publication.requested.v1` | API | YouTube worker | publicationId |
| `publication.remoteCreated.v1` | YouTube worker | reconciler/SSE | publicationId, remoteId |
| `publication.published.v1` | reconciler | analytics scheduler/SSE | publicationId |
| `analytics.syncRequested.v1` | scheduler/API | analytics worker | publicationId, window |
| `analytics.snapshotAdded.v1` | analytics worker | insight worker | publicationId, snapshotId |
| `learning.proposalCreated.v1` | AI worker | SSE | learningUpdateId |
| `learning.applyRequested.v1` | API | learning worker | learningUpdateId |
| `workspace.deleteRequested.v1` | API | deletion orchestrator | workspaceId, policyVersion |

## Queues and jobs

| Job type / queue | Timeout | Attempts/backoff | Concurrency/idempotency | Terminal output |
|---|---:|---|---|---|
| `media.probe` / media | 5m | 3; 10s exponential+jitter | per asset checksum+probe version | probe facts |
| `media.normalize` / media | 30m | 2; 30s exponential | per asset+recipe | mezzanine derivative |
| `media.derivatives` / media | 15m | 3; 15s exponential | per asset+recipe set | proxy/poster/contact sheet |
| `media.transcribe` / AI | 20m | 3 provider-aware | workspace AI budget; asset+provider version | transcript |
| `media.analyzeShots` / AI/media | 20m | 2 | per asset+analysis version | shots/facts |
| `asset.finalize` / general | 2m | 5; 5s exponential | per asset version | ready/rejected state |
| `asset.delete` / cleanup | 30m | 5; 1m exponential | per asset deletion generation | deletion report |
| `trend.refresh` / scheduler | 10m | 3; 5m | one niche/region/language/window | snapshot |
| `ai.directions` / AI | 3m | 2 incl. one repair | workspace model concurrency; context hash | 3 directions |
| `ai.edl` / AI | 3m | 2 incl. one repair | context+direction+schema version | creative version |
| `render.preview` / media | 15m | 2 | workspace limit; render cache key | preview+QC |
| `render.master` / media | 45m | 2 | workspace limit; render cache key | master+QC |
| `youtube.upload` / publishing | 2h | 8; provider Retry-After/exponential | publication id; reconcile first | remote video/checkpoint |
| `youtube.reconcile` / publishing | 5m | 10 bounded schedule | publication+remote state | canonical publication state |
| `analytics.sync` / analytics | 15m | 5; quota-aware | publication+window+definition | snapshots |
| `insight.generate` / AI | 3m | 2 | snapshot set hash | evidence-bound narrative |
| `learning.propose` / AI | 5m | 2 | evidence set+policy version | proposal |
| `learning.apply` / general | 2m | 3 | learning update ID | DNA version |
| `storage.reconcile` / cleanup | 1h | 2 | environment singleton, paged | reconciliation report |
| `retention.sweep` / cleanup | 1h | 2 | policy+day, paged | deletion jobs |
| `workspace.export` / cleanup | 2h | 2 | export request ID | encrypted expiring archive |
| `workspace.delete` / cleanup | 24h | 10 step-aware | deletion request generation | evidence report |

## Execution rules

- States: `queued, running, retrying, succeeded, failed, cancelRequested, canceled, deadLettered`.
- Progress is monotonic 0–100 within an attempt; stage names are catalogue-controlled.
- Workers heartbeat at less than half the lease duration. Expired leases become retry candidates.
- Retry only normalized retryable failures. Schema, authorization, rights, quota policy, and deterministic media errors are not blindly retried.
- Provider `Retry-After` overrides backoff within configured maximum. Jitter prevents thundering herds.
- Cancellation is cooperative and must terminate child processes, release reservations, and clean partial objects.
- Dead letters retain safe metadata and replay instructions; replay creates an audit event.
- Payload evolution is additive within a version; breaking changes create `.v2` and dual-read during migration.

## Scheduler

| Trigger | Default | Guard |
|---|---|---|
| Outbox dispatch | continuous/1s poll | leased batches; skip locked |
| Upload expiry | hourly | sessions past expiry only |
| Trend refresh | daily | source quota and stale threshold |
| Publication reconciliation | every 15m while nonterminal | stop at terminal/age limit |
| Analytics sync | every 6h | published only; scope/quota present |
| Retention sweep | daily | legal hold and policy snapshot |
| Storage reconciliation | daily | dry-run by default in new environment |

## Operational gates

Metrics: queue depth/oldest age, duration percentiles, attempt count, failure by code, lease recovery, dead letters, provider spend/quota, cancellation latency. Alerts use sustained thresholds and link to runbooks. Logs contain correlation IDs and safe states, never payload secrets, signed URLs, tokens, transcript text, or raw media.
