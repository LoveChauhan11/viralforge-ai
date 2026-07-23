import { and, eq, sql } from "drizzle-orm";
import type { Database } from "./index.js";
import { jobs, newId, outboxEvents } from "./index.js";

export type CreateJobInput = {
  workspaceId: string;
  type: string;
  idempotencyKey: string;
  queue: string;
  payload?: Record<string, unknown>;
  requestId?: string;
  requestedBy?: string;
  maxAttempts?: number;
};

export type CreateJobResult = {
  jobId: string;
  outboxEventId: string | null;
  created: boolean;
};

/**
 * Atomically inserts a job + outbox event. Duplicate idempotency key returns the existing job.
 */
export async function createJobWithOutbox(
  db: Database,
  input: CreateJobInput,
): Promise<CreateJobResult> {
  const existing = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      and(
        eq(jobs.workspaceId, input.workspaceId),
        eq(jobs.type, input.type),
        eq(jobs.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  if (existing[0]) {
    return { jobId: existing[0].id, outboxEventId: null, created: false };
  }

  const jobId = newId();
  const outboxEventId = newId();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(jobs).values({
        id: jobId,
        workspaceId: input.workspaceId,
        type: input.type,
        idempotencyKey: input.idempotencyKey,
        queue: input.queue,
        state: "queued",
        maxAttempts: input.maxAttempts ?? 3,
        requestedBy: input.requestedBy,
        result: input.payload ?? {},
      });

      await tx.insert(outboxEvents).values({
        id: outboxEventId,
        workspaceId: input.workspaceId,
        aggregateType: "job",
        aggregateId: jobId,
        eventType: "job.queued",
        payload: {
          queueName: input.queue,
          envelope: {
            jobId,
            workspaceId: input.workspaceId,
            type: input.type,
            idempotencyKey: input.idempotencyKey,
            payload: input.payload ?? {},
            requestId: input.requestId,
            outboxEventId,
          },
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|duplicate/i.test(message)) {
      const again = await db
        .select({ id: jobs.id })
        .from(jobs)
        .where(
          and(
            eq(jobs.workspaceId, input.workspaceId),
            eq(jobs.type, input.type),
            eq(jobs.idempotencyKey, input.idempotencyKey),
          ),
        )
        .limit(1);
      if (again[0]) {
        return { jobId: again[0].id, outboxEventId: null, created: false };
      }
    }
    throw error;
  }

  return { jobId, outboxEventId, created: true };
}

export async function claimOutboxBatch(
  db: Database,
  owner: string,
  limit: number,
  leaseSeconds: number,
): Promise<
  Array<{
    id: string;
    workspaceId: string;
    payload: { queueName: string; envelope: Record<string, unknown> };
    attempts: number;
  }>
> {
  const result = await db.execute(sql`
    UPDATE outbox_events AS o
    SET
      claim_owner = ${owner},
      claim_expires_at = NOW() + (${leaseSeconds}::int * INTERVAL '1 second'),
      attempts = o.attempts + 1
    WHERE o.id IN (
      SELECT id FROM outbox_events
      WHERE published_at IS NULL
        AND (claim_expires_at IS NULL OR claim_expires_at < NOW())
      ORDER BY occurred_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING o.id, o.workspace_id, o.payload, o.attempts
  `);

  const list = (result as unknown as Array<Record<string, unknown>>) ?? [];
  return list.map((row) => ({
    id: String(row["id"]),
    workspaceId: String(row["workspace_id"]),
    payload: row["payload"] as { queueName: string; envelope: Record<string, unknown> },
    attempts: Number(row["attempts"] ?? 0),
  }));
}

export async function markOutboxPublished(db: Database, id: string): Promise<void> {
  await db
    .update(outboxEvents)
    .set({
      publishedAt: new Date(),
      claimOwner: null,
      claimExpiresAt: null,
      lastErrorCode: null,
    })
    .where(eq(outboxEvents.id, id));
}

export async function markOutboxDispatchError(
  db: Database,
  id: string,
  safeErrorCode: string,
): Promise<void> {
  await db
    .update(outboxEvents)
    .set({
      lastErrorCode: safeErrorCode,
      claimOwner: null,
      claimExpiresAt: null,
    })
    .where(eq(outboxEvents.id, id));
}

const TERMINAL = new Set(["succeeded", "failed", "cancelled"]);

export async function acquireJobLease(
  db: Database,
  jobId: string,
  workspaceId: string,
  workerId: string,
  leaseSeconds: number,
): Promise<{ acquired: boolean; state: string }> {
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)))
    .limit(1);
  const job = rows[0];
  if (!job) return { acquired: false, state: "missing" };
  if (TERMINAL.has(job.state)) return { acquired: false, state: job.state };

  const leaseExpired = !job.leaseExpiresAt || job.leaseExpiresAt.getTime() < Date.now();
  if (job.leaseOwner && job.leaseOwner !== workerId && !leaseExpired) {
    return { acquired: false, state: job.state };
  }

  const bumpAttempt = job.leaseOwner !== workerId;
  await db
    .update(jobs)
    .set({
      state: "running",
      leaseOwner: workerId,
      leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000),
      heartbeatAt: new Date(),
      startedAt: job.startedAt ?? new Date(),
      attemptCount: job.attemptCount + (bumpAttempt ? 1 : 0),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)));

  return { acquired: true, state: "running" };
}

export async function completeJob(
  db: Database,
  jobId: string,
  workspaceId: string,
  result: Record<string, unknown>,
): Promise<boolean> {
  const rows = await db
    .select({ state: jobs.state })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)))
    .limit(1);
  const state = rows[0]?.state;
  if (!state || TERMINAL.has(state)) return false;

  await db
    .update(jobs)
    .set({
      state: "succeeded",
      result,
      finishedAt: new Date(),
      leaseOwner: null,
      leaseExpiresAt: null,
      progress: 100,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)));
  return true;
}

export async function getJob(db: Database, jobId: string, workspaceId: string) {
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateJobProgress(
  db: Database,
  jobId: string,
  workspaceId: string,
  progress: number,
  stage: string,
): Promise<void> {
  await db
    .update(jobs)
    .set({
      progress,
      stage,
      heartbeatAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)));
}

export async function failJob(
  db: Database,
  jobId: string,
  workspaceId: string,
  safeErrorCode: string,
  detail?: Record<string, unknown>,
): Promise<boolean> {
  const rows = await db
    .select({ state: jobs.state })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)))
    .limit(1);
  const state = rows[0]?.state;
  if (!state || TERMINAL.has(state)) return false;

  await db
    .update(jobs)
    .set({
      state: "failed",
      safeErrorCode,
      safeErrorDetail: detail ?? {},
      finishedAt: new Date(),
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)));
  return true;
}

export async function cancelJob(
  db: Database,
  jobId: string,
  workspaceId: string,
): Promise<{ cancelled: boolean; state: string }> {
  const job = await getJob(db, jobId, workspaceId);
  if (!job) return { cancelled: false, state: "missing" };
  if (TERMINAL.has(job.state)) return { cancelled: false, state: job.state };

  await db
    .update(jobs)
    .set({
      state: "cancelled",
      finishedAt: new Date(),
      leaseOwner: null,
      leaseExpiresAt: null,
      safeErrorCode: "cancelled_by_user",
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, workspaceId)));
  return { cancelled: true, state: "cancelled" };
}

export function isTerminalJobState(state: string): boolean {
  return TERMINAL.has(state);
}
