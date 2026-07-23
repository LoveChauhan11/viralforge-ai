# Cursor Handoff Checklist

## Start

1. Clone the repository and create a feature branch.
2. Read `AGENTS.md`, `.cursor/rules/viralforge.mdc`, `README.md`, and all documents under `docs/`.
3. Open `docs/05-execution/CURSOR_MASTER_PROMPT.md` as the lead-agent instruction.
4. Produce a short dependency-aware Sprint 0 plan mapped to `SPRINT_0_BACKLOG.md`.
5. Create bounded subagent tasks only where work can be independently verified.

## Guardrails

- Do not begin feature implementation beyond Sprint 0.
- Do not require paid keys; use fake adapters.
- Do not persist media on Railway disk.
- Do not scrape protected YouTube surfaces or attach Shorts-library music through unsupported means.
- Do not make an architectural choice affecting persistence, contracts, security, or deployment without checking existing ADRs and adding one if required.
- Do not mark items complete without evidence.

## Expected first output

- Proposed monorepo tree and dependency direction.
- Chosen pinned runtime/tool versions with reasons.
- Sprint 0 item sequencing and parallel lanes.
- Open decisions requiring ADRs.
- Risks and assumptions.
- Planned commands and proof for each exit gate.

## Expected final Sprint 0 output

Use the handoff format in `DEFINITION_OF_DONE.md`, update traceability/risk/environment documents, and state whether Sprint 1 entry criteria are met.
