# Security Policy

## Reporting

Do not open a public issue for a vulnerability or exposed credential. Contact the repository owner privately through GitHub and include affected component, reproduction, impact, and suggested mitigation. Do not include real user media or secrets.

## Baseline

- No credentials, OAuth refresh tokens, private media, or production exports in git.
- Secrets are injected by the runtime and validated at startup.
- Tenant authorization is enforced server-side on every data and object-storage operation.
- Signed object URLs are short-lived and scoped.
- Uploads are validated by signature, size, duration, and codec; filenames are untrusted.
- FFmpeg runs with bounded resources, timeouts, isolated temporary directories, and no network authority.
- OAuth state/PKCE, encrypted token storage, least scopes, rotation, and revocation are required.
- Logs and traces must redact tokens, URLs containing signatures, prompts containing private content, and personal data.
- AI/provider outputs are untrusted input and schema-validated.
- Dependency, container, secret, and static scans become required CI gates in Sprint 0.

## Incident priorities

1. Revoke or rotate exposed credentials.
2. Contain affected jobs, integrations, and storage access.
3. Preserve audit evidence without copying private content.
4. Patch and validate tenant isolation.
5. Notify affected users when required.
6. Record root cause and preventive controls.

See `docs/03-engineering/SECURITY_AND_PRIVACY.md` for the full threat model and controls.
