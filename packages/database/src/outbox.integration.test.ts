import {
  claimOutboxBatch,
  createDb,
  createJobWithOutbox,
  jobs,
  markOutboxPublished,
  newId,
  outboxEvents,
  users,
  workspaces,
  workspaceMembers,
  acquireJobLease,
  completeJob,
} from "./index.js";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("job + outbox integration", () => {
  const db = createDb(databaseUrl!);
  let workspaceId: string;
  let userId: string;

  beforeAll(async () => {
    userId = newId();
    workspaceId = newId();
    await db.insert(users).values({
      id: userId,
      email: `outbox-${userId}@example.invalid`,
      displayName: "Outbox",
    });
    await db.insert(workspaces).values({
      id: workspaceId,
      name: "Outbox WS",
      slug: `outbox-${workspaceId}`,
      ownerUserId: userId,
    });
    await db.insert(workspaceMembers).values({
      id: newId(),
      workspaceId,
      userId,
      role: "owner",
    });
  });

  it("creates one job for duplicate idempotency keys", async () => {
    const key = `idem-${newId()}`;
    const a = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: "viralforge-general",
      requestId: "r1",
    });
    const b = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: "viralforge-general",
      requestId: "r2",
    });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.jobId).toBe(a.jobId);

    const outboxRows = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, a.jobId));
    expect(outboxRows).toHaveLength(1);
  });

  it("claims outbox once and lease prevents duplicate terminal complete", async () => {
    const key = `idem-${newId()}`;
    const created = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: "viralforge-general",
    });
    expect(created.outboxEventId).toBeTruthy();

    const claimed1 = await claimOutboxBatch(db, "sched-a", 50, 30);
    const mine = claimed1.filter((c) => c.id === created.outboxEventId);
    expect(mine).toHaveLength(1);
    await markOutboxPublished(db, created.outboxEventId!);

    const claimed2 = await claimOutboxBatch(db, "sched-b", 50, 30);
    expect(claimed2.find((c) => c.id === created.outboxEventId)).toBeUndefined();

    const workerA = await acquireJobLease(db, created.jobId, workspaceId, "worker-a", 60);
    expect(workerA.acquired).toBe(true);
    const workerB = await acquireJobLease(db, created.jobId, workspaceId, "worker-b", 60);
    expect(workerB.acquired).toBe(false);

    expect(await completeJob(db, created.jobId, workspaceId, { ok: true })).toBe(true);
    expect(await completeJob(db, created.jobId, workspaceId, { ok: true })).toBe(false);

    const row = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, created.jobId), eq(jobs.workspaceId, workspaceId)))
      .limit(1);
    expect(row[0]?.state).toBe("succeeded");
  });
});
