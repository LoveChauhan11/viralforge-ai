import { createLocalAuthProvider, LOCAL_USER_HEADER } from "@viralforge/auth";
import {
  createDb,
  findActiveMembership,
  newId,
  recordAuthzAudit,
  userExists,
  users,
  workspaceMembers,
  workspaces,
  type Database,
} from "@viralforge/database";
import { createLogger } from "@viralforge/observability";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApiApp } from "./app.js";
import type { FastifyInstance } from "fastify";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";

describe("API authz (Fastify)", () => {
  let db: Database;
  let app: FastifyInstance;
  let userA: string;
  let userB: string;
  let wsA: string;
  let wsB: string;

  beforeAll(async () => {
    db = createDb(databaseUrl);
    userA = newId();
    userB = newId();
    wsA = newId();
    wsB = newId();

    await db.insert(users).values([
      { id: userA, email: `auth-a-${userA}@example.invalid`, displayName: "Auth A" },
      { id: userB, email: `auth-b-${userB}@example.invalid`, displayName: "Auth B" },
    ]);
    await db.insert(workspaces).values([
      { id: wsA, name: "Auth A", slug: `auth-a-${wsA}`, ownerUserId: userA },
      { id: wsB, name: "Auth B", slug: `auth-b-${wsB}`, ownerUserId: userB },
    ]);
    await db.insert(workspaceMembers).values([
      { id: newId(), workspaceId: wsA, userId: userA, role: "owner" },
      { id: newId(), workspaceId: wsB, userId: userB, role: "owner" },
      { id: newId(), workspaceId: wsA, userId: userB, role: "viewer" },
    ]);

    const auth = createLocalAuthProvider({
      appEnv: "test",
      userExists: (id) => userExists(db, id),
    });

    app = await buildApiApp({
      serviceName: "api",
      appEnv: "test",
      databaseUrl,
      db,
      auth,
      memberships: {
        findActiveMembership: (workspaceId, userId) =>
          findActiveMembership(db, workspaceId, userId),
      },
      audit: { record: (event) => recordAuthzAudit(db, event) },
      logger: createLogger("api-test"),
    });
    await app.ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("returns 401 without identity", async () => {
    const res = await app.inject({ method: "GET", url: `/v1/workspaces/${wsA}` });
    expect(res.statusCode).toBe(401);
    expect(res.json().title).toBe("Unauthorized");
  });

  it("returns 403 when viewer cannot manage members", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${wsA}/members`,
      headers: { [LOCAL_USER_HEADER]: userB },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().title).toBe("Forbidden");
  });

  it("returns 404 for cross-tenant workspace (non-member)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${wsB}`,
      headers: { [LOCAL_USER_HEADER]: userA },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 200 for viewer read", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${wsA}`,
      headers: { [LOCAL_USER_HEADER]: userB },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().role).toBe("viewer");
  });

  it("returns 200 for owner", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${wsA}`,
      headers: { [LOCAL_USER_HEADER]: userA },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(wsA);
  });

  it("records audit without email payloads", async () => {
    const { auditEvents } = await import("@viralforge/database");
    const rows = await db.select().from(auditEvents).limit(100);
    const forWs = rows.filter((row) => row.targetId === wsA);
    expect(forWs.length).toBeGreaterThan(0);
    for (const row of forWs) {
      expect(JSON.stringify(row.metadata)).not.toContain("@example");
    }
  });
});
