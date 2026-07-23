import { describe, expect, it, vi } from "vitest";
import { authorize } from "./authorize.js";
import { AuthError } from "./errors.js";
import { createLocalAuthProvider, LOCAL_USER_HEADER } from "./local.js";
import type { MembershipStore, Principal, WorkspaceMembership } from "./types.js";

const principal: Principal = {
  userId: "11111111-1111-4111-8111-111111111111",
  authProvider: "local",
};
const workspaceId = "22222222-2222-4222-8222-222222222222";

function membership(role: WorkspaceMembership["role"]): WorkspaceMembership {
  return { workspaceId, userId: principal.userId, role, status: "active" };
}

describe("createLocalAuthProvider", () => {
  it("refuses construction in production", () => {
    expect(() => createLocalAuthProvider({ appEnv: "production" })).toThrow(/cannot be enabled/);
  });

  it("authenticates from header in local env", async () => {
    const auth = createLocalAuthProvider({ appEnv: "local" });
    const result = await auth.authenticate({
      get: (name) => (name === LOCAL_USER_HEADER ? principal.userId : undefined),
    });
    expect(result).toEqual(principal);
  });

  it("returns null when header missing", async () => {
    const auth = createLocalAuthProvider({ appEnv: "local" });
    await expect(auth.authenticate({ get: () => undefined })).resolves.toBeNull();
  });
});

describe("authorize", () => {
  it("returns 401-class error when unauthenticated", async () => {
    const memberships: MembershipStore = {
      findActiveMembership: vi.fn(),
    };
    const audit = { record: vi.fn() };
    await expect(
      authorize({
        principal: null,
        workspaceId,
        permission: "workspace:read",
        memberships,
        audit,
      }),
    ).rejects.toMatchObject({ code: "unauthenticated", status: 401 });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ decision: "unauthenticated", action: "authorize:workspace:read" }),
    );
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain("@");
  });

  it("returns 404-class error for cross-tenant / non-member", async () => {
    const memberships: MembershipStore = {
      findActiveMembership: async () => null,
    };
    try {
      await authorize({
        principal,
        workspaceId,
        permission: "workspace:read",
        memberships,
      });
      throw new Error("expected AuthError");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).code).toBe("not_found");
      expect((error as AuthError).status).toBe(404);
    }
  });

  it("returns 403 when role is insufficient", async () => {
    const memberships: MembershipStore = {
      findActiveMembership: async () => membership("viewer"),
    };
    await expect(
      authorize({
        principal,
        workspaceId,
        permission: "workspace:manage_members",
        memberships,
      }),
    ).rejects.toMatchObject({ code: "forbidden", status: 403 });
  });

  it("allows owner for manage_members", async () => {
    const memberships: MembershipStore = {
      findActiveMembership: async () => membership("owner"),
    };
    const result = await authorize({
      principal,
      workspaceId,
      permission: "workspace:manage_members",
      memberships,
    });
    expect(result.membership.role).toBe("owner");
  });
});
