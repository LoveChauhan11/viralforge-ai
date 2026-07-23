import { createLocalAuthProvider, LOCAL_USER_HEADER } from "@viralforge/auth";
import {
  claimOutboxBatch,
  createDb,
  findActiveMembership,
  getJob,
  markOutboxDispatchError,
  markOutboxPublished,
  newId,
  recordAuthzAudit,
  userExists,
  users,
  workspaceMembers,
  workspaces,
  type Database,
} from "@viralforge/database";
import { createLogger } from "@viralforge/observability";
import { dispatchOutboxBatch, InMemoryQueuePublisher, type JobEnvelope } from "@viralforge/queue";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApiApp } from "./app.js";
import {
  processFoundationJob,
  type FoundationPayload,
} from "../../../workers/general/src/foundation.js";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";

describe("foundation job vertical flow", () => {
  let db: Database;
  let app: FastifyInstance;
  let userId: string;
  let workspaceId: string;
  const publisher = new InMemoryQueuePublisher();
  const logger = createLogger("foundation-e2e");

  beforeAll(async () => {
    db = createDb(databaseUrl);
    userId = newId();
    workspaceId = newId();

    await db.insert(users).values({
      id: userId,
      email: `flow-${userId}@example.invalid`,
      displayName: "Flow",
    });
    await db.insert(workspaces).values({
      id: workspaceId,
      name: "Flow WS",
      slug: `flow-${workspaceId}`,
      ownerUserId: userId,
    });
    await db.insert(workspaceMembers).values({
      id: newId(),
      workspaceId,
      userId,
      role: "owner",
    });

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
        findActiveMembership: (ws, uid) => findActiveMembership(db, ws, uid),
      },
      audit: { record: (event) => recordAuthzAudit(db, event) },
      logger: createLogger("api-foundation-test"),
    });
    await app.ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  async function dispatchAndProcess(jobId: string): Promise<void> {
    await dispatchOutboxBatch({
      owner: `e2e-${newId().slice(0, 8)}`,
      publisher,
      store: {
        claimBatch: async (owner, limit, leaseSeconds) => {
          const rows = await claimOutboxBatch(db, owner, limit, leaseSeconds);
          return rows.map((row) => ({
            id: row.id,
            workspaceId: row.workspaceId,
            attempts: row.attempts,
            payload: {
              queueName: row.payload.queueName,
              envelope: row.payload.envelope as JobEnvelope,
            },
          }));
        },
        markPublished: (id) => markOutboxPublished(db, id),
        markDispatchError: (id, code) => markOutboxDispatchError(db, id, code),
      },
    });

    const published = publisher.published.find((p) => p.envelope.jobId === jobId);
    expect(published).toBeTruthy();
    const envelope = published!.envelope as JobEnvelope<FoundationPayload>;
    await processFoundationJob({
      db,
      envelope,
      workerId: `worker-${newId().slice(0, 8)}`,
      logger,
    });
  }

  it("create → outbox → worker → terminal without duplicate on retry", async () => {
    const idempotencyKey = `e2e-${newId()}`;
    const create1 = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/foundation`,
      headers: { [LOCAL_USER_HEADER]: userId },
      payload: { idempotencyKey, mode: "succeed", message: "vertical" },
    });
    expect(create1.statusCode).toBe(201);
    const body1 = create1.json();
    expect(body1.created).toBe(true);
    expect(body1.job.state).toBe("queued");

    const create2 = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/foundation`,
      headers: { [LOCAL_USER_HEADER]: userId },
      payload: { idempotencyKey, mode: "succeed", message: "vertical" },
    });
    expect(create2.statusCode).toBe(200);
    expect(create2.json().created).toBe(false);
    expect(create2.json().job.id).toBe(body1.job.id);

    await dispatchAndProcess(body1.job.id);

    const get = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}/jobs/${body1.job.id}`,
      headers: { [LOCAL_USER_HEADER]: userId },
    });
    expect(get.statusCode).toBe(200);
    expect(get.json().job.state).toBe("succeeded");
    expect(get.json().job.progress).toBe(100);
    expect(get.json().job.result).toMatchObject({ message: "vertical" });
  });

  it("surfaces failure and timeout terminal states", async () => {
    const failKey = `fail-${newId()}`;
    const failCreate = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/foundation`,
      headers: { [LOCAL_USER_HEADER]: userId },
      payload: { idempotencyKey: failKey, mode: "fail" },
    });
    await dispatchAndProcess(failCreate.json().job.id);
    const failGet = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}/jobs/${failCreate.json().job.id}`,
      headers: { [LOCAL_USER_HEADER]: userId },
    });
    expect(failGet.json().job.state).toBe("failed");
    expect(failGet.json().job.safeErrorCode).toBe("foundation_forced_failure");

    const timeoutKey = `timeout-${newId()}`;
    const timeoutCreate = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/foundation`,
      headers: { [LOCAL_USER_HEADER]: userId },
      payload: { idempotencyKey: timeoutKey, mode: "timeout" },
    });
    await dispatchAndProcess(timeoutCreate.json().job.id);
    const timeoutGet = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}/jobs/${timeoutCreate.json().job.id}`,
      headers: { [LOCAL_USER_HEADER]: userId },
    });
    expect(timeoutGet.json().job.state).toBe("failed");
    expect(timeoutGet.json().job.safeErrorCode).toBe("foundation_timeout");
  });

  it("cancels a queued job and keeps it terminal", async () => {
    const key = `cancel-${newId()}`;
    const create = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/foundation`,
      headers: { [LOCAL_USER_HEADER]: userId },
      payload: { idempotencyKey: key, mode: "succeed" },
    });
    const jobId = create.json().job.id;

    const cancel = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/${jobId}/cancel`,
      headers: { [LOCAL_USER_HEADER]: userId },
    });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json().cancelled).toBe(true);
    expect(cancel.json().job.state).toBe("cancelled");

    const row = await getJob(db, jobId, workspaceId);
    expect(row?.state).toBe("cancelled");
  });

  it("rejects unauthorized create", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/jobs/foundation`,
      payload: { idempotencyKey: "x", mode: "succeed" },
    });
    expect(res.statusCode).toBe(401);
  });
});
