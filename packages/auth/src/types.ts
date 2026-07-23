export type WorkspaceRole = "owner" | "admin" | "creator" | "editor" | "viewer";

export type Permission =
  "workspace:read" | "workspace:manage_members" | "job:create" | "job:read" | "job:cancel";

export type Principal = {
  userId: string;
  authProvider: "local" | "oidc";
};

export type WorkspaceMembership = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: "active" | "invited" | "disabled";
};

export type AuthRequestHeaders = {
  get(name: string): string | undefined;
};

export type AuthDecision = {
  allowed: boolean;
  reason: "ok" | "unauthenticated" | "forbidden_role" | "not_a_member" | "inactive_membership";
  permission?: Permission;
  workspaceId?: string;
  role?: WorkspaceRole;
};

export type AuditAuthzEvent = {
  workspaceId?: string;
  actorId?: string;
  action: string;
  decision: AuthDecision["reason"];
  targetType: string;
  targetId?: string;
  requestId?: string;
};

export interface AuthProvider {
  readonly name: "local" | "oidc";
  authenticate(headers: AuthRequestHeaders): Promise<Principal | null>;
}

export interface MembershipStore {
  findActiveMembership(workspaceId: string, userId: string): Promise<WorkspaceMembership | null>;
}

export interface AuthzAuditWriter {
  record(event: AuditAuthzEvent): Promise<void>;
}

const ROLE_PERMISSIONS: Record<WorkspaceRole, ReadonlySet<Permission>> = {
  owner: new Set([
    "workspace:read",
    "workspace:manage_members",
    "job:create",
    "job:read",
    "job:cancel",
  ]),
  admin: new Set([
    "workspace:read",
    "workspace:manage_members",
    "job:create",
    "job:read",
    "job:cancel",
  ]),
  creator: new Set(["workspace:read", "job:create", "job:read", "job:cancel"]),
  editor: new Set(["workspace:read", "job:create", "job:read", "job:cancel"]),
  viewer: new Set(["workspace:read", "job:read"]),
};

export function roleAllows(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
