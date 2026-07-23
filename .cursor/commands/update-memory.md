# Command: Update Memory

Update memory only from verified current state:

- `CURRENT_STATE`: branch/commit/environment, working flows and stage.
- `ACTIVE_TASK`: single active ID, objective, owner, blockers, immediate next step.
- `IMPLEMENTATION_PROGRESS`: backlog status and evidence link.
- `ARCHITECTURE_DECISIONS`: ADR summary/link; never rewrite accepted history.
- `KNOWN_ISSUES`: severity, impact, reproduction, owner/status.
- `TEST_EVIDENCE`: command/environment/result/artifact.
- `NEXT_ACTIONS`: ordered, dependency-aware actions.

Keep entries concise, dated in UTC, free of secrets/private data, and committed with the related change.
