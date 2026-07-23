# ViralForge AI — ForgeOS

Production blueprint for an autonomous YouTube Shorts production studio that turns locally uploaded photos and videos into high-retention, 15–30-second vertical videos.

## Product outcome

ViralForge AI discovers relevant Shorts patterns, understands a creator's content, selects clips, builds a story, edits a 9:16 short, generates metadata and thumbnails, publishes through YouTube APIs, measures performance, and learns what works for that creator.

## Important music constraint

YouTube does not expose a public API that lets third-party applications attach tracks from the Shorts music library. ForgeOS therefore uses the approved Option 1 workflow:

1. ForgeOS identifies a suitable music trend and prepares a beat-aware edit.
2. It exports/publishes the video without copyrighted audio.
3. It gives the creator the recommended track, timing, and volume.
4. The creator adds that track inside the YouTube mobile app before final publication.

Original, licensed, or creator-owned audio may be rendered automatically when rights allow.

## Documentation map

- [Product requirements](docs/01-product/PRODUCT_REQUIREMENTS.md)
- [UX specification](docs/01-product/UX_SPECIFICATION.md)
- [System architecture](docs/02-architecture/SYSTEM_ARCHITECTURE.md)
- [AI agents and memory](docs/02-architecture/AI_AGENTS_AND_MEMORY.md)
- [Data model](docs/02-architecture/DATA_MODEL.md)
- [Database schema specification](docs/02-architecture/DATABASE_SCHEMA_SPECIFICATION.md)
- [Complete API endpoint specification](docs/02-architecture/API_ENDPOINT_SPECIFICATION.md)
- [Event and job catalogue](docs/02-architecture/EVENT_AND_JOB_CATALOG.md)
- [AI agent contracts](docs/02-architecture/AI_AGENT_CONTRACTS.md)
- [Media pipeline](docs/03-engineering/MEDIA_PIPELINE.md)
- [FFmpeg, caption and transition catalogue](docs/03-engineering/FFMPEG_RECIPE_AND_TRANSITION_CATALOG.md)
- [AI evaluation and golden dataset](docs/03-engineering/AI_EVALUATION_AND_GOLDEN_DATASET.md)
- [Trend and music intelligence](docs/03-engineering/TREND_AND_MUSIC.md)
- [Security and privacy](docs/03-engineering/SECURITY_AND_PRIVACY.md)
- [Railway deployment](docs/04-delivery/RAILWAY_DEPLOYMENT.md)
- [Testing strategy](docs/04-delivery/TEST_STRATEGY.md)
- [End-to-end acceptance-test catalogue](docs/04-delivery/END_TO_END_ACCEPTANCE_TEST_CATALOG.md)
- [Operations](docs/04-delivery/OPERATIONS.md)
- [Implementation roadmap](docs/05-execution/IMPLEMENTATION_ROADMAP.md)
- [Sprint 0–6 executable backlogs](docs/05-execution/IMPLEMENTATION_ROADMAP.md)
- [Definition of done](docs/05-execution/DEFINITION_OF_DONE.md)
- [Cursor handoff checklist](docs/05-execution/CURSOR_HANDOFF_CHECKLIST.md)
- [Cursor master prompt](docs/05-execution/CURSOR_MASTER_PROMPT.md)
- [Architecture decisions](docs/06-governance/ARCHITECTURE_DECISIONS.md)
- [Requirements traceability](docs/06-governance/REQUIREMENTS_TRACEABILITY.md)
- [Risk register](docs/06-governance/RISK_REGISTER.md)
- [Cost model](docs/06-governance/COST_MODEL.md)
- [Environment matrix](docs/06-governance/ENVIRONMENT_MATRIX.md)
- [Role and authorization matrix](docs/06-governance/AUTHORIZATION_MATRIX.md)
- [Configuration-variable catalogue](docs/06-governance/CONFIGURATION_VARIABLE_CATALOG.md)

Repository controls:

- [Agent working agreement](AGENTS.md)
- [Cursor repository rule](.cursor/rules/viralforge.mdc)
- [Cursor specialist agents](.cursor/agents/lead-architect.md)
- [Cursor execution commands](.cursor/commands/start-sprint.md)
- [Persistent implementation memory](memory-bank/PROJECT_CONTEXT.md)
- [Contribution rules](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Safe environment template](.env.example)

## MVP definition

The first production release supports one creator workspace, local uploads, automatic media analysis, clip selection, an adaptive 15–30-second story plan with optional exact-30 mode, deterministic FFmpeg rendering, preview and manual override, YouTube OAuth publishing, metadata generation, trend recommendations, the Option 1 music handoff, analytics ingestion, and creator-specific learning.

## Working principles

- Deterministic media rendering; AI proposes structured edit decisions.
- Every AI output is schema-validated and recoverable.
- All long-running work is asynchronous, idempotent, observable, and retryable.
- No API key is committed. Missing integrations degrade gracefully.
- Mobile-first UX and Railway-compatible deployment are required.
- Use YouTube APIs and permitted public data only; no brittle scraping or circumvention.
- Keep raw uploads private and lifecycle-managed.

## Start here

Clone the repository into Cursor, create a feature branch, and open [CURSOR_MASTER_PROMPT.md](docs/05-execution/CURSOR_MASTER_PROMPT.md). Run the start-sprint command, execute Sprint 0 item by item, and advance through Sprints 1–6 only after each sprint exit and [Definition of Done](docs/05-execution/DEFINITION_OF_DONE.md) are fully evidenced. Keep `memory-bank/` current after every task.

Executable code, CI, containers, and Railway service configuration are deliberate Sprint 0 outputs. The repository currently contains the complete product/architecture/execution specification and safe bootstrap controls; it does not pretend unbuilt services are deployable.
