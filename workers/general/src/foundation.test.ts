import { createLogger } from "@viralforge/observability";
import {
  cancelJob,
  createDb,
  createJobWithOutbox,
  getJob,
  newId,
  users,
  workspaceMembers,
  workspaces,
} from "@viralforge/database";
import { QUEUE_GENERAL, type JobEnvelope } from "@viralforge/queue";
import { beforeAll, describe, expect, it } from "vitest";
import { processFoundationJob, type FoundationPayload } from "./foundation.js";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";

describe("processFoundationJob", () => {
  const db = createDb(databaseUrl);
  const logger = createLogger("worker-general-test");
  let workspaceId: string;
  let userId: string;

  beforeAll(async () => {
    userId = newId();
    workspaceId = newId();
    await db.insert(users).values({
      id: userId,
      email: `foundation-${userId}@example.invalid`,
      displayName: "Foundation",
    });
    await db.insert(workspaces).values({
      id: workspaceId,
      name: "Foundation WS",
      slug: `foundation-${workspaceId}`,
      ownerUserId: userId,
    });
    await db.insert(workspaceMembers).values({
      id: newId(),
      workspaceId,
      userId,
      role: "owner",
    });
  });

  function envelope(
    jobId: string,
    payload: FoundationPayload,
    idempotencyKey: string,
  ): JobEnvelope<FoundationPayload> {
    return {
      jobId,
      workspaceId,
      type: "foundation.sample",
      idempotencyKey,
      payload,
      requestId: "req-test",
    };
  }

  it("succeeds and is idempotent on retry", async () => {
    const key = `ok-${newId()}`;
    const created = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: QUEUE_GENERAL,
      payload: { mode: "succeed", message: "hello" },
    });

    const first = await processFoundationJob({
      db,
      envelope: envelope(created.jobId, { mode: "succeed", message: "hello" }, key),
      workerId: "w-ok-1",
      logger,
    });
    expect(first.outcome).toBe("succeeded");

    const second = await processFoundationJob({
      db,
      envelope: envelope(created.jobId, { mode: "succeed", message: "hello" }, key),
      workerId: "w-ok-2",
      logger,
    });
    expect(second.outcome).toBe("skipped");
    expect(second.state).toBe("succeeded");

    const job = await getJob(db, created.jobId, workspaceId);
    expect(job?.progress).toBe(100);
    expect(job?.result).toMatchObject({ message: "hello" });
  });

  it("fails visibly for mode=fail", async () => {
    const key = `fail-${newId()}`;
    const created = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: QUEUE_GENERAL,
      payload: { mode: "fail" },
    });

    const result = await processFoundationJob({
      db,
      envelope: envelope(created.jobId, { mode: "fail" }, key),
      workerId: "w-fail",
      logger,
    });
    expect(result.outcome).toBe("failed");
    const job = await getJob(db, created.jobId, workspaceId);
    expect(job?.state).toBe("failed");
    expect(job?.safeErrorCode).toBe("foundation_forced_failure");
  });

  it("records timeout mode as failed", async () => {
    const key = `timeout-${newId()}`;
    const created = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: QUEUE_GENERAL,
      payload: { mode: "timeout" },
    });

    const result = await processFoundationJob({
      db,
      envelope: envelope(created.jobId, { mode: "timeout" }, key),
      workerId: "w-timeout",
      logger,
    });
    expect(result.outcome).toBe("failed");
    const job = await getJob(db, created.jobId, workspaceId);
    expect(job?.safeErrorCode).toBe("foundation_timeout");
  });

  it("skips cancelled jobs", async () => {
    const key = `cancel-${newId()}`;
    const created = await createJobWithOutbox(db, {
      workspaceId,
      type: "foundation.sample",
      idempotencyKey: key,
      queue: QUEUE_GENERAL,
      payload: { mode: "succeed" },
    });
    await cancelJob(db, created.jobId, workspaceId);

    const result = await processFoundationJob({
      db,
      envelope: envelope(created.jobId, { mode: "succeed" }, key),
      workerId: "w-cancel",
      logger,
    });
    expect(result.outcome).toBe("skipped");
    expect(result.state).toBe("cancelled");
  });
});
