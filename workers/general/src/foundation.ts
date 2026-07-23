import type { Database } from "@viralforge/database";
import {
  acquireJobLease,
  completeJob,
  failJob,
  getJob,
  isTerminalJobState,
  updateJobProgress,
} from "@viralforge/database";
import type { JobEnvelope } from "@viralforge/queue";
import {
  recordJobTerminal,
  withExtractedContext,
  withSpan,
  type Logger,
} from "@viralforge/observability";

export type FoundationPayload = {
  mode?: "succeed" | "fail" | "timeout";
  message?: string;
};

/**
 * Processes one foundation.sample job. Safe to retry: terminal states are no-ops.
 */
export async function processFoundationJob(options: {
  db: Database;
  envelope: JobEnvelope<FoundationPayload>;
  workerId: string;
  logger: Logger;
  leaseSeconds?: number;
}): Promise<{ outcome: "succeeded" | "failed" | "skipped" | "cancelled"; state: string }> {
  const started = Date.now();
  const run = async (): Promise<{
    outcome: "succeeded" | "failed" | "skipped" | "cancelled";
    state: string;
  }> => {
    const { db, envelope, workerId, logger } = options;
    const leaseSeconds = options.leaseSeconds ?? 60;

    const existing = await getJob(db, envelope.jobId, envelope.workspaceId);
    if (!existing) {
      return { outcome: "skipped", state: "missing" };
    }
    if (isTerminalJobState(existing.state)) {
      return { outcome: "skipped", state: existing.state };
    }
    if (existing.state === "cancelled") {
      return { outcome: "cancelled", state: "cancelled" };
    }

    const lease = await acquireJobLease(
      db,
      envelope.jobId,
      envelope.workspaceId,
      workerId,
      leaseSeconds,
    );
    if (!lease.acquired) {
      return { outcome: "skipped", state: lease.state };
    }

    const mode = envelope.payload?.mode ?? "succeed";
    const log = logger.child({
      jobId: envelope.jobId,
      workspaceId: envelope.workspaceId,
      requestId: envelope.requestId,
      workerId,
    });

    await updateJobProgress(db, envelope.jobId, envelope.workspaceId, 10, "started");
    log.info("foundation job progress", { progress: 10, stage: "started" });

    const mid = await getJob(db, envelope.jobId, envelope.workspaceId);
    if (mid?.state === "cancelled") {
      return { outcome: "cancelled", state: "cancelled" };
    }

    await updateJobProgress(db, envelope.jobId, envelope.workspaceId, 50, "working");

    if (mode === "fail") {
      await failJob(db, envelope.jobId, envelope.workspaceId, "foundation_forced_failure", {
        mode,
      });
      log.info("foundation job failed", { safeErrorCode: "foundation_forced_failure" });
      return { outcome: "failed", state: "failed" };
    }

    if (mode === "timeout") {
      await failJob(db, envelope.jobId, envelope.workspaceId, "foundation_timeout", { mode });
      log.info("foundation job timed out", { safeErrorCode: "foundation_timeout" });
      return { outcome: "failed", state: "failed" };
    }

    const done = await completeJob(db, envelope.jobId, envelope.workspaceId, {
      message: envelope.payload?.message ?? "foundation",
      workerId,
    });
    if (!done) {
      const latest = await getJob(db, envelope.jobId, envelope.workspaceId);
      return { outcome: "skipped", state: latest?.state ?? "unknown" };
    }

    log.info("foundation job succeeded", { progress: 100 });
    return { outcome: "succeeded", state: "succeeded" };
  };

  return withExtractedContext({ traceparent: options.envelope.traceparent }, async () =>
    withSpan(
      "job.process",
      {
        jobId: options.envelope.jobId,
        workspaceId: options.envelope.workspaceId,
        "job.type": options.envelope.type,
        requestId: options.envelope.requestId,
        workerId: options.workerId,
      },
      async () => {
        const result = await run();
        if (result.outcome === "succeeded" || result.outcome === "failed") {
          recordJobTerminal(result.outcome, options.envelope.type, Date.now() - started);
        }
        return result;
      },
    ),
  );
}
