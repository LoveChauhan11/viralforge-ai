# Risk Register

Ratings: likelihood and impact are Low, Medium, or High. Owners are roles until named.

| ID | Risk | Likelihood | Impact | Mitigation / trigger | Owner |
|---|---|---:|---:|---|---|
| R-01 | Unsupported access to Shorts music library or copyrighted audio | High | High | Enforce Option 1: recommend timing, export without protected audio, creator attaches in YouTube app | Product/Engineering |
| R-02 | Trend discovery becomes brittle or violates platform terms | Medium | High | Use official APIs/permitted public inputs; provider abstraction; graceful stale-data UX; no circumvention | Product/Legal |
| R-03 | Railway ephemeral disk causes media loss | High | High | Durable object storage only; startup/runtime checks; recovery tests | Platform |
| R-04 | FFmpeg jobs exhaust CPU, memory, or time | High | High | Dedicated media worker, bounded concurrency/resources/timeouts, quotas, cancellation, cost alerts | Media/Platform |
| R-05 | Cross-tenant media or data exposure | Medium | Critical | Central authorization, workspace-keyed rows/objects, short signed URLs, adversarial isolation tests | Security |
| R-06 | Duplicate queue delivery publishes or charges twice | Medium | High | Transactional outbox, idempotency keys, leases, unique constraints, terminal-effect fencing | Backend |
| R-07 | Provider cost spikes or runaway retries | Medium | High | Per-workspace budgets, retry caps, circuit breakers, usage metrics, kill switches | Platform/Product |
| R-08 | AI produces invalid or unsafe edit decisions | High | Medium | Strict schemas, deterministic validation, confidence/fallback rules, evaluation fixtures | AI/Media |
| R-09 | YouTube quota/OAuth changes block publishing | Medium | High | Capability-aware adapter, queued retry, manual export fallback, token revocation UX | Integrations |
| R-10 | Raw uploads or tokens leak through logs/traces | Medium | High | Central redaction, signed-URL stripping, prompt/privacy policy, telemetry tests | Security/Platform |
| R-11 | Public repository receives secrets or private samples | Medium | Critical | Ignore rules, pre-commit/CI secret scan, synthetic fixtures, immediate rotation runbook | Maintainer |
| R-12 | Scope expands before foundation is reliable | High | High | Sprint gates, traceability, explicit backlog IDs, no Sprint 1 before Sprint 0 evidence | Lead agent |
| R-13 | Output quality is technically valid but not engaging | Medium | High | Creator feedback, rubric/evaluations, versioned strategies, analytics learning, human override | Product/AI |
| R-14 | Processing cost makes unit economics unsustainable | Medium | High | Measure per-minute/per-render cost, proxy media, caching, model tiers, quotas | Product/Finance |

## Review cadence

Review at every sprint handoff and before production releases. New High/Critical risks require an owner, mitigation, observable trigger, and release decision. Closed risks retain resolution evidence.
