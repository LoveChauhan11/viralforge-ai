# Command: Review Task

Input: backlog task ID and candidate change.

Review independently for: requirement coverage; contract/schema drift; tenant/role enforcement; state/idempotency/concurrency; failure/retry/cancel; privacy/rights/secrets; performance/cost; accessibility; tests and observability; migration/rollback.

Output findings first, ordered Critical/High/Medium/Low, each with file/location, evidence, impact, and required fix. Then list acceptance criteria with pass/fail/no-evidence. Do not modify code unless separately asked.
