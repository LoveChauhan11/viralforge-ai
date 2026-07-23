import { authorize, LOCAL_USER_HEADER } from "@viralforge/auth";
import { normalizePageLimit } from "@viralforge/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ApiDeps } from "../deps.js";

const workspaceParams = z.object({
  workspaceId: z.string().uuid(),
});

const listQuery = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

function headerStore(headers: Record<string, string | string[] | undefined>) {
  return {
    get(name: string): string | undefined {
      const value = headers[name.toLowerCase()];
      return Array.isArray(value) ? value[0] : value;
    },
  };
}

export async function registerWorkspaceRoutes(app: FastifyInstance, deps: ApiDeps): Promise<void> {
  app.get("/v1/workspaces/:workspaceId", async (request) => {
    const params = workspaceParams.parse(request.params);
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    const { membership } = await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "workspace:read",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "workspace",
      targetId: params.workspaceId,
    });
    return {
      id: membership.workspaceId,
      role: membership.role,
      userId: membership.userId,
      requestId: request.requestId,
    };
  });

  app.get("/v1/workspaces/:workspaceId/members", async (request) => {
    const params = workspaceParams.parse(request.params);
    // Validate pagination query before domain work (invalid never reaches authorize).
    const query = listQuery.parse(request.query);
    const limit = normalizePageLimit(query.limit);

    const principal = await deps.auth.authenticate(headerStore(request.headers));
    const { membership } = await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "workspace:manage_members",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "workspace_members",
      targetId: params.workspaceId,
    });

    return {
      workspaceId: membership.workspaceId,
      actorRole: membership.role,
      requestId: request.requestId,
      page: {
        items: [] as unknown[],
        nextCursor: null as string | null,
        limit,
        cursor: query.cursor ?? null,
      },
    };
  });

  // Echo local header name for operator docs (not a secret).
  app.get("/v1/meta/auth", async () => ({
    authProvider: deps.auth.name,
    localUserHeader: LOCAL_USER_HEADER,
  }));
}
