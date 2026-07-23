# Cursor Master Execution Prompt

You are the lead engineering agent for ViralForge AI / ForgeOS. Build the production system described in this repository. Treat all documents as binding. Where documents conflict, priority is: security/privacy, architecture decisions, product requirements, API/data contracts, engineering details, then implementation convenience.

## Operating rules

1. Start with Sprint 0 only. Do not jump to feature screens before foundations work.
2. Inspect the repository and create a short implementation plan with dependencies.
3. Use subagents by bounded domain when available: platform, web UX, media, AI/evaluation, data/API, QA/security. One lead agent owns integration.
4. Keep a modular-monolith architecture with deployable workers.
5. Use strict TypeScript. Add Python only when a selected computer-vision dependency justifies it.
6. AI emits schema-valid decisions. Deterministic code executes them.
7. Never commit keys or block development on missing keys. Provide fake adapters and env examples.
8. Never store durable media on Railway local disk.
9. Use official YouTube APIs and the documented Option 1 music handoff.
10. Every write and job is idempotent. All long work is asynchronous, observable, bounded, and retryable.
11. Build mobile-first from 360 px and test accessibility.
12. Make small, reviewable commits. Do not leave hidden TODOs for security, tenancy, deletion, or failure handling.

## Required Sprint 0 deliverables

- Repository structure from SYSTEM_ARCHITECTURE.md.
- Root scripts for dev, build, lint, typecheck, test, test:e2e, migrate, and seed.
- Shared configuration with per-service validation.
- Shared contracts and problem-details errors.
- Database schema/migration baseline for user, workspace, member, job, and outbox.
- Auth abstraction and a safe local development implementation.
- API request ID, structured logging, error mapping, authorization guard, and health endpoints.
- BullMQ queues plus transactional-outbox dispatcher.
- A sample idempotent job with progress, heartbeat, retry, and persistence.
- Web shell containing Today, Create, Insights, Library, Settings.
- Mobile navigation and accessible design tokens/components.
- Object-storage adapter with local S3-compatible development service.
- Model, transcription, trends, and YouTube interfaces with fake adapters.
- Docker builds and Railway service configuration.
- CI with lint, typecheck, unit/integration tests, image build, secret scan, and dependency scan.
- OpenTelemetry wiring.
- README local setup and docs for adding a provider.

## Quality gates

Before declaring Sprint 0 complete:

- Clean install works from a fresh checkout.
- One documented command boots all local dependencies and services.
- Database migration and seed are repeatable.
- Tenant A cannot read or mutate Tenant B.
- Duplicate sample-job requests produce one logical job.
- Worker death allows lease recovery without duplicate result.
- Fake-provider mode requires no external keys.
- Web works at 360, 768, and 1440 px.
- Health checks behave correctly when dependencies are unavailable.
- Tests pass and staging deployment is healthy.
- No secrets or private sample media exist in git.

## Decision discipline

When a choice is not specified, create a short ADR before implementing if it affects persistence, public contracts, security, deployability, or major dependencies. Prefer boring, maintained technology. Record assumptions and continue unless the choice is irreversible or conflicts with product intent.

## Handoff format after each sprint

Report completed scope, architecture decisions, commands, migrations, tests and results, deployed services, remaining risks, cost implications, and exact next-sprint entry criteria. Do not merely list files; demonstrate the vertical flow.
