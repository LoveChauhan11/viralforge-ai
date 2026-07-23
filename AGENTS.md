# Agent Working Agreement

This repository is an executable product blueprint. Read README.md and all documents under docs before changing architecture or beginning a sprint.

## Priority

Security/privacy → accepted architecture decisions → product requirements → API/data contracts → engineering documents → convenience.

## Boundaries

- Modular monolith plus explicit workers.
- Domain packages contain no framework/provider imports.
- Media and AI workers do not depend on web UI.
- Models return validated structured decisions and receive no direct infrastructure authority.
- PostgreSQL is authoritative; Redis and derivatives are recoverable.
- Durable binaries belong in object storage.
- Creative and published versions are immutable.

## Required behavior

- Work sprint by sprint from IMPLEMENTATION_ROADMAP.md.
- Create an ADR for material unspecified choices.
- Use fake provider adapters and never require credentials for local tests.
- Add tests, telemetry, error/retry behavior, tenant authorization, and documentation with each vertical slice.
- Preserve the Option 1 YouTube music workflow.
- Test responsive UI from 360 px.
- Never add scraping, copyright circumvention, secret material, or private sample media.
- Run all quality gates before handoff.

## Handoff

State what works end to end, commands executed, tests/results, migrations, deployment status, decisions, risks, and next entry criteria. Do not declare completion based only on files created.
