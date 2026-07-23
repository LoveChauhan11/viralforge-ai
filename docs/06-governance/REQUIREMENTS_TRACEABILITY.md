# Requirements Traceability

This is the living index from product intent to implementation and evidence. Cursor must add code paths and test references as they are created.

| ID | Requirement | Source | Target area | Initial evidence |
|---|---|---|---|---|
| VF-P01 | Local media upload and managed asset library | Product requirements | Web/API/storage | Sprint 1 |
| VF-P02 | Automatic media understanding and clip selection | Product requirements | AI/media workers | Sprint 2 |
| VF-P03 | Adaptive 15–30-second vertical story with optional exact-30 mode and deterministic render | Product/media specs | Planner/media worker | S2-07, S3-01–06, E2E-AI-03 |
| VF-P04 | Preview and manual override | Product/UX | Web/API | Sprint 3 |
| VF-P05 | YouTube OAuth upload/publish | Product/API | YouTube adapter | Sprint 4 |
| VF-P06 | Option 1 music recommendation and mobile handoff | Trend/music spec | Trend/UI/publish flow | Sprint 4 |
| VF-P07 | Analytics ingestion and creator-specific learning | Product/AI memory | Analytics/memory | Sprint 5 |
| VF-N01 | Mobile-first at 360/768/1440 | UX specification | Web/design system | S0-10 and later E2E |
| VF-N02 | Tenant isolation across DB, API, queue, and storage | Security/data model | All services | S0-05/06/08/11 integration tests |
| VF-N03 | Idempotent asynchronous work with recovery | Architecture | API/outbox/queues/workers | S0-08/09 fault tests |
| VF-N04 | Schema-validated AI outputs; deterministic execution | AI architecture | Contracts/providers/workers | S0-12 and later contract tests |
| VF-N05 | No durable Railway local-disk dependency | Architecture/deployment | Storage/services | S0-11/14 deployment tests |
| VF-N06 | Local/fake mode requires no paid credentials | Delivery | Config/providers | S0-04/12 clean-start test |
| VF-N07 | Observable jobs and provider usage | Operations | Telemetry | S0-13 trace/metric evidence |
| VF-N08 | Secure upload, OAuth, secret, and retention handling | Security/privacy | API/storage/integrations | Security tests and scans |
| VF-N09 | Compliant music/rights workflow | Trend/music | Recommendation/publish | Policy tests and product QA |
| VF-N10 | Explicit role authorization and cross-tenant denial | Authorization matrix | API/jobs/storage/support | E2E-AUTH-01–06 |
| VF-N11 | Complete typed API and stable problem errors | API endpoint specification | API/web client | Contract drift gate |
| VF-N12 | Typed outbox/events/jobs with leases, retries, cancellation and dead letters | Event/job catalogue | API/scheduler/workers | S0-08 and E2E-OPS |
| VF-N13 | AI regression gates and rights-cleared golden data | AI evaluation specification | AI/QA | E2E-AI and provider eval gate |
| VF-N14 | Server-authoritative configuration, quotas and safe production flags | Configuration catalogue | All services | S0-04, S6-08 |
| VF-N15 | Full journey, resilience, privacy and accessibility acceptance coverage | E2E acceptance catalogue | QA/release | Sprint 6 gate |

## Update rule

For every implemented requirement, append exact package/file paths, API/event/schema names, automated test identifiers, deployment evidence, and the commit/PR. Do not replace the requirement wording with implementation detail.
