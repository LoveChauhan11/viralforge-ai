# Cost Model and Guardrails

The system must expose unit economics before scale. Never hard-code vendor prices; maintain configurable rates and record actual metered usage.

## Cost dimensions

| Dimension | Meter | Allocation key |
|---|---|---|
| Object storage | GB-month, requests, egress | Workspace/project/asset |
| Upload/processing bandwidth | GB ingress/egress | Workspace/project/job |
| Media compute | CPU-seconds, memory-seconds, wall time | Render/analysis job |
| Model inference | Input/output units and calls | Provider/model/job |
| Transcription | Audio minutes | Asset/job |
| Trend/YouTube APIs | Requests and quota units | Workspace/integration |
| PostgreSQL/Redis | Plan cost and utilization | Environment, apportioned by jobs |
| Observability | Logs, metrics, traces, retention | Service/environment |

## Required controls

- Per-workspace daily/monthly usage and spend budgets.
- Per-job estimated cost before expensive execution.
- Hard limits for upload bytes, duration, asset count, concurrency, retry count, and retained derivatives.
- Model/provider tiers with capability and maximum-cost metadata.
- Cache reusable transcripts, embeddings, proxies, and analyses by immutable content hash.
- Cancel abandoned work and garbage-collect temporary/expired objects.
- Alert on cost per completed Short, failure waste, retry amplification, storage growth, and egress anomalies.
- Admin kill switches for provider, workspace, queue, and publish operations.

## Product metrics

Track cost per uploaded minute, analyzed minute, candidate clip, preview, completed render, published Short, and successful creator outcome. Separate fixed environment cost from marginal job cost.

## Sprint 0 evidence

- Usage schema and telemetry fields exist.
- Fake provider reports deterministic synthetic usage.
- Limits are configuration-validated.
- Sample job shows estimated and actual cost fields.
- Operations docs define budget alerts and emergency shutdown.

Prices and production budgets must be filled from selected providers immediately before deployment; they are intentionally not guessed in this blueprint.
