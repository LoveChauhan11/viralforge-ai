import { loadServiceConfig, toLogSafeConfig } from "@viralforge/config";
import { createDb, pingDatabase } from "@viralforge/database";
import { createLogger } from "@viralforge/observability";
import { QUEUE_GENERAL, type JobEnvelope } from "@viralforge/queue";
import { startServiceRuntime } from "@viralforge/service-kit";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { randomUUID } from "node:crypto";
import { processFoundationJob, type FoundationPayload } from "./foundation.js";

const serviceName = "worker-general";
const config = loadServiceConfig(serviceName);
const logger = createLogger(serviceName);
const databaseUrl =
  config.databaseUrl ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";
const redisUrl = config.redisUrl ?? "redis://localhost:6379";
const db = createDb(databaseUrl);
const workerId = `general-${randomUUID().slice(0, 8)}`;
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const bullWorker = new Worker(
  QUEUE_GENERAL,
  async (job) => {
    const envelope = job.data as JobEnvelope<FoundationPayload>;
    if (envelope.type !== "foundation.sample") {
      logger.warn("ignored unknown job type", { type: envelope.type, workerId });
      return;
    }
    const result = await processFoundationJob({
      db,
      envelope,
      workerId,
      logger,
    });
    logger.info("job processed", {
      jobId: envelope.jobId,
      outcome: result.outcome,
      state: result.state,
      workerId,
      requestId: envelope.requestId,
    });
  },
  {
    connection,
    prefix: "viralforge-local",
    concurrency: Number(process.env.WORKER_CONCURRENCY_GENERAL ?? 2),
  },
);

bullWorker.on("failed", (job, error) => {
  logger.error("bullmq job failed", {
    jobId: job?.id,
    message: error.message,
    workerId,
  });
});

const runtime = await startServiceRuntime({
  serviceName,
  port: Number(process.env.PORT ?? 4004),
  ready: async () => {
    try {
      await pingDatabase(databaseUrl);
      return {
        status: "ok" as const,
        service: serviceName,
        checks: { process: "up" as const, database: "up" as const, redis: "up" as const },
      };
    } catch {
      return {
        status: "unavailable" as const,
        service: serviceName,
        checks: { process: "up" as const, database: "down" as const },
      };
    }
  },
  onShutdown: async () => {
    await bullWorker.close();
    await connection.quit();
    logger.info("shutting down", { workerId });
  },
});

logger.info("listening", {
  ...toLogSafeConfig(config),
  workerId,
  queue: QUEUE_GENERAL,
});

export { runtime, processFoundationJob, workerId };
