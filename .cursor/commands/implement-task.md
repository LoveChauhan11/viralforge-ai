# Command: Implement Task

Input: one backlog task ID.

1. Load current memory and exact task acceptance criteria; declare affected contracts and files.
2. Inspect existing implementation/tests; do not overwrite unrelated work.
3. Implement the smallest complete vertical behavior with migration, authorization, idempotency, errors, observability, docs, and rollback where applicable.
4. Add unit/integration/contract/E2E evidence including negative and failure paths.
5. Run focused then relevant repository gates.
6. Update progress, decisions, issues, evidence, and next action. Commit message starts with task ID.

Never mark complete while an acceptance criterion lacks behavior/evidence.
