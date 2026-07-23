# Role and Authorization Matrix

Roles are workspace-scoped. `platformOperator` is an internal break-glass role, not a workspace membership. Deny by default; ownership checks and workspace scope apply to every allowed action.

| Resource/action | Owner | Admin | Creator | Editor | Viewer | Platform operator |
|---|---:|---:|---:|---:|---:|---:|
| View workspace/profile | ✓ | ✓ | ✓ | ✓ | ✓ | Metadata only |
| Edit creator profile/DNA | ✓ | ✓ | ✓ | ✓ | — | — |
| Manage members/roles | ✓ | ✓ except owner | — | — | — | — |
| Transfer/delete workspace | ✓ | — | — | — | — | — |
| Create/upload/delete own assets | ✓ | ✓ | ✓ | ✓ | — | Diagnostic metadata only |
| View workspace assets | ✓ | ✓ | ✓ | ✓ | ✓ | No media by default |
| Create/edit projects | ✓ | ✓ | ✓ | ✓ | — | — |
| Generate directions/renders | ✓ | ✓ | ✓ | ✓ | — | Retry job only |
| Approve publication | ✓ | ✓ | ✓ | — | — | — |
| Connect/disconnect YouTube | ✓ | ✓ | — | — | — | — |
| Publish/schedule | ✓ | ✓ | ✓ if approved policy | — | — | Reconcile only |
| View analytics | ✓ | ✓ | ✓ | ✓ | ✓ | Aggregated health only |
| Approve/revert DNA learning | ✓ | ✓ | ✓ | — | — | — |
| Export workspace data | ✓ | ✓ | — | — | — | — |
| Change quotas/provider flags | ✓ view | ✓ view | — | — | — | Audited support policy |
| Access secrets/tokens | — | — | — | — | — | Key service only; no human plaintext |

## Mandatory decision rules

- Owners cannot remove/demote the last active owner.
- Admin cannot grant owner, transfer ownership, delete the workspace, or bypass publication approval.
- Creator publish requires an owner/admin-approved workspace policy; default is approval required.
- Viewer access is read-only and excludes signed original downloads unless explicitly granted in a future entitlement.
- Platform operators may inspect job/event/log metadata and trigger safe retry/reconciliation. Private media access requires a time-bound support grant from an owner, reason, audit event, and automatic expiry.
- OAuth tokens, encryption keys, upload session URIs, raw provider errors, and signed object URLs are never human-readable permissions.

## Enforcement tests

For each tenant endpoint and job:

1. Unauthenticated returns `401`.
2. Authenticated without membership returns `404` for non-discoverable resource or `403` where existence is already known.
3. Wrong workspace ID/object reference is denied.
4. Insufficient role is denied without side effects.
5. Allowed role succeeds and emits required audit event.
6. A queued job re-resolves authorization/workspace ownership; it does not trust client payload claims.
