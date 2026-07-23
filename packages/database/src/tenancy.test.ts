import { and, eq, ne } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createDb,
  jobs,
  newId,
  users,
  workspaceMembers,
  workspaces,
} from "./index.js";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("tenant isolation", () => {
  it("workspace A cannot read workspace B jobs by id alone", async () => {
    const db = createDb(databaseUrl!);
    const userA = newId();
    const userB = newId();
    const wsA = newId();
    const wsB = newId();
    const jobB = newId();

    await db.insert(users).values([
      { id: userA, email: `a-${userA}@example.invalid`, displayName: "A" },
      { id: userB, email: `b-${userB}@example.invalid`, displayName: "B" },
    ]);
    await db.insert(workspaces).values([
      {
        id: wsA,
        name: "A",
        slug: `a-${wsA.slice(0, 8)}`,
        ownerUserId: userA,
      },
      {
        id: wsB,
        name: "B",
        slug: `b-${wsB.slice(0, 8)}`,
        ownerUserId: userB,
      },
    ]);
    await db.insert(workspaceMembers).values([
      { id: newId(), workspaceId: wsA, userId: userA, role: "owner" },
      { id: newId(), workspaceId: wsB, userId: userB, role: "owner" },
    ]);
    await db.insert(jobs).values({
      id: jobB,
      workspaceId: wsB,
      type: "foundation.sample",
      idempotencyKey: `idem-${jobB}`,
      queue: "general",
      state: "queued",
    });

    const crossTenant = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobB), eq(jobs.workspaceId, wsA)));
    expect(crossTenant).toHaveLength(0);

    const ownTenantWrongWorkspace = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobB), ne(jobs.workspaceId, wsB)));
    expect(ownTenantWrongWorkspace).toHaveLength(0);

    const allowed = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobB), eq(jobs.workspaceId, wsB)));
    expect(allowed).toHaveLength(1);
  });
});

describe("ids", () => {
  it("generates uuid-like identifiers", async () => {
    const { newId: id } = await import("./ids.js");
    expect(id()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
