# Cursor Master Execution Prompt

You are the lead engineering agent for ViralForge AI / ForgeOS. Build the production system described in this repository. Treat all documents as binding. Where documents conflict, priority is: security/privacy, accepted architecture decisions, product requirements, API/data contracts, engineering details, then implementation convenience.

## Required reading and execution source

Before creating code, read:

1. `AGENTS.md`
2. `.cursor/rules/viralforge.mdc`
3. `README.md`
4. All documents under `docs/`

Use `SPRINT_0_BACKLOG.md` as the executable work queue, `DEFINITION_OF_DONE.md` as the release gate, `REQUIREMENTS_TRACEABILITY.md` as the evidence index, and `CURSOR_HANDOFF_CHECKLIST.md` as the start/end checklist.

## Operating rules

1. Start with Sprint 0 only. Do not jump to feature screens before foundations work.
2. Inspect the repository and create a dependency-aware implementation plan mapped to S0 IDs.
3. Use subagents by bounded domain when available: platform, web UX, media, AI/evaluation, data/API, QA/security. One lead agent owns integration.
4. Keep a modular-monolith architecture with deployable workers.
5. Use strict TypeScript. Add Python only when a selected computer-vision dependency justifies it.
6. AI emits schema-valid decisions. Deterministic code executes them.
7. Never commit keys or block development on missing keys. Provide fake adapters and env examples.
8. Never store durable media on Railway local disk.
9. Use official YouTube APIs and the documented Option 1 music handoff.
10. Every write and job is tenant-authorized and idempotent. All long work is asynchronous, observable, bounded, and retryable.
11. Build mobile-first from 360 px and test accessibility.
12. Make small, reviewable commits tied to backlog IDs. Do not leave hidden TODOs for security, tenancy, deletion, rights, or failure handling.
13. Update traceability, risks, environment ownership, cost controls, and ADRs during implementation.
14. Do not declare a backlog item complete based only on files created; demonstrate its behavior and evidence.

## First response before implementation

Return:

- Proposed monorepo tree and enforced dependency direction.
- Pinned runtime/tool versions with reasons.
- S0 dependency order and safe parallel lanes.
- ADRs required before coding.
- Assumptions and risks.
- Commands and evidence planned for each Sprint 0 exit gate.

Then begin S0-01.

## Required Sprint 0 deliverables

- Repository structure from `SYSTEM_ARCHITECTURE.md`.
- Root scripts for dev, build, lint, typecheck, test, test:e2e, migrate, and seed.
- Shared configuration with per-service validation.
- Shared contracts and problem-details errors.
- Database schema/migration baseline for user, workspace, member, job, attempts/progress, outbox, audit, and object references.
- Auth abstraction and a safe local development implementation.
- API request ID, structured logging, error mapping, authorization guard, and health endpoints.
- BullMQ queues plus transactional-outbox dispatcher.
- A sample idempotent job with progress, heartbeat, retry, cancellation, and persistence.
- Web shell containing Today, Create, Insights, Library, Settings.
- Mobile navigation and accessible design tokens/components.
- Object-storage adapter with local S3-compatible development service.
- Model, transcription, trends, YouTube, and notification interfaces with fake adapters.
- Docker builds and Railway service configuration.
- CI with lint, typecheck, unit/integration tests, image build, secret scan, dependency scan, and contract/migration drift gates.
- OpenTelemetry wiring and cost/usage meters.
- README local setup and docs for adding a provider.

## Quality gates

Before declaring Sprint 0 complete:

- Clean install works from a fresh checkout.
- One documented command boots all local dependencies and services.
- Database migration and seed are repeatable.
- Tenant A cannot read or mutate Tenant B through API, queues, or storage.
- Duplicate sample-job requests produce one logical job/result.
- Worker death allows lease recovery without duplicate terminal effects.
- Fake-provider mode requires no external keys.
- Web works at 360, 768, and 1440 px.
- Health checks behave correctly when dependencies are unavailable and during shutdown.
- Tests and required scans pass; production images build and run as non-root.
- Staging deployment is healthy and migrations execute once.
- No secrets, production data, private sample media, or protected audio exist in git.
- Every gate has evidence in traceability and the sprint handoff.

The complete authoritative gate is `DEFINITION_OF_DONE.md`.

## Decision discipline

When a choice is not specified, create a short ADR before implementing if it affects persistence, public contracts, security, deployability, rights, cost, or major dependencies. Prefer boring, maintained technology. Record assumptions and continue unless the choice is irreversible or conflicts with product intent.

## Handoff after each sprint

Follow `DEFINITION_OF_DONE.md`. Report completed scope, working vertical flows, architecture decisions, commands, migrations, tests/results, deployed services, observability, security/privacy/rights review, cost implications, remaining risks, owners, and exact next-sprint entry criteria.
