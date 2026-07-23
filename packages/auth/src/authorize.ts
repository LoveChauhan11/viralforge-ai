import { AuthError } from "./errors.js";
import { roleAllows } from "./types.js";
import type {
  AuthzAuditWriter,
  MembershipStore,
  Permission,
  Principal,
  WorkspaceMembership,
} from "./types.js";

export type AuthorizeInput = {
  principal: Principal | null;
  workspaceId: string;
  permission: Permission;
  memberships: MembershipStore;
  audit?: AuthzAuditWriter;
  requestId?: string;
  targetType?: string;
  targetId?: string;
};

export type AuthorizeResult = {
  principal: Principal;
  membership: WorkspaceMembership;
};

/**
 * Central authorization guard. Cross-tenant / non-member → not_found (404).
 * Authenticated member lacking role → forbidden (403). Missing principal → 401.
 */
export async function authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
  const targetType = input.targetType ?? "workspace";
  const targetId = input.targetId ?? input.workspaceId;

  const writeAudit = async (decision: Parameters<AuthzAuditWriter["record"]>[0]["decision"]) => {
    const event: Parameters<AuthzAuditWriter["record"]>[0] = {
      action: `authorize:${input.permission}`,
      decision,
      targetType,
    };
    event.workspaceId = input.workspaceId;
    if (input.principal?.userId) event.actorId = input.principal.userId;
    if (targetId) event.targetId = targetId;
    if (input.requestId) event.requestId = input.requestId;
    await input.audit?.record(event);
  };

  if (!input.principal) {
    await writeAudit("unauthenticated");
    throw new AuthError("unauthenticated", "Authentication required");
  }

  const membership = await input.memberships.findActiveMembership(
    input.workspaceId,
    input.principal.userId,
  );

  if (!membership) {
    await writeAudit("not_a_member");
    throw new AuthError("not_found", "Workspace not found");
  }

  if (membership.status !== "active") {
    await writeAudit("inactive_membership");
    throw new AuthError("forbidden", "Membership is not active");
  }

  if (!roleAllows(membership.role, input.permission)) {
    await writeAudit("forbidden_role");
    throw new AuthError("forbidden", "Insufficient role for this action");
  }

  await writeAudit("ok");
  return { principal: input.principal, membership };
}
