# ADR-012 — Configuration validation with Zod

**Status:** Accepted  
**Date:** 2026-07-23  
**Backlog:** S0-04

## Context

Services need schema-validated configuration with safe local/fake defaults and hard failures in production when required secrets are missing. Secrets must never appear in logs or client bundles.

## Decision

Use **Zod** in `@viralforge/config` to parse `process.env` into typed configs per service. Local/test defaults select fake providers. Production/staging reject missing required variables with redacted error messages (names only, never values).

## Alternatives

- **envalid** — solid, less compositional for shared/base schemas.
- **Hand-rolled parsers** — more code, weaker typing.

## Consequences

- Config package depends on Zod only (no framework imports).
- Services call `loadApiConfig()` / equivalents at boot.
- Secret-bearing fields are omitted from `toLogSafeConfig()`.

## Exit

Swap validator library only via ADR amendment; keep the public `load*Config` surface stable.
