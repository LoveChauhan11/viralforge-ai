# Security and Privacy

## Threat model

Protect private source media, OAuth tokens, unpublished output, user identity, model context, and publishing authority. Main threats are tenant isolation failures, malicious uploads, signed-URL leakage, OAuth theft, injection through filenames/transcripts, unsafe media processing, dependency compromise, and unintended publication.

## Controls

### Identity and authorization

Use a maintained authentication provider or proven library. Enforce server-side workspace membership and role checks on every resource. Use secure, HTTP-only, same-site cookies and CSRF protection where applicable. Rate-limit auth and sensitive actions. Record security-relevant audit events.

### OAuth and YouTube

Use authorization code with PKCE and state. Request minimum scopes. Encrypt refresh tokens using envelope encryption or a managed secret service; store only an encrypted reference where possible. Never expose refresh tokens to the browser or logs. Support revoke/reconnect. Publishing requires a recent explicit approval record tied to one immutable master and metadata version.

### Uploads

Signed multipart URLs are short-lived, workspace-scoped, content-length constrained where supported, and single-purpose. Verify file signatures, checksum, MIME type, codec/container, duration, and dimensions. Sanitize filenames for display only; generated IDs define object keys.

Process media in isolated, non-root workers with no inbound ports, restricted filesystem, bounded CPU/RAM/time, patched FFmpeg, and minimal network access. Treat transcripts and metadata as untrusted data, never instructions.

### Application

Validate all inputs with shared schemas. Use parameterized queries. Escape output. Set Content Security Policy, HSTS, secure headers, and strict CORS. Avoid unsafe HTML. Protect state-changing endpoints with idempotency and authorization.

### AI

Prompts clearly delimit untrusted content. Agents have bounded typed tools and no direct credentials. Validate every response against JSON Schema and domain rules. Minimize content sent to providers, disclose provider processing, and support fake/local adapters. Do not use customer media for training by default.

### Secrets

No secrets in repository, client bundles, images, logs, screenshots, or error payloads. Railway variables are scoped per service. Validate required variables at startup. Rotate compromised keys and document ownership.

## Privacy lifecycle

Document purpose, lawful basis/consent where required, processor list, storage region, retention, export, deletion, and incident response. Project deletion creates a tombstone job that deletes objects and derivatives, then verifies completion. Account deletion revokes OAuth first. Backups expire by policy.

## Logging

Use request and job IDs. Redact tokens, signed URLs, email where unnecessary, filenames, transcripts, prompts, and provider bodies. Store only safe error summaries. Restrict production log access and set retention.

## Security gates

- Dependency and container scanning.
- Secret scanning and protected branches.
- Static analysis.
- Tenant-isolation tests.
- Upload corpus including malformed media.
- Authorization matrix tests.
- OAuth callback and replay tests.
- Backup-restore drill.
- Incident runbook and contact ownership.

Critical or high exploitable findings block production.
