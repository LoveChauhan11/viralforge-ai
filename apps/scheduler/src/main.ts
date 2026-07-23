import { loadServiceConfig, toLogSafeConfig } from "@viralforge/config";
import {
  claimOutboxBatch,
  createDb,
  markOutboxDispatchError,
  markOutboxPublished,
  pingDatabase,
} from "@viralforge/database";
import { createLogger } from "@viralforge/observability";
import {
  BullMqQueuePublisher,
  dispatchOutboxBatch,
  type JobEnvelope,
} from "@viralforge/queue";
import { startServiceRuntime } from "@viralforge/service-kit";
import { randomUUID } from "node:crypto";

const serviceName = "scheduler";
const config = loadServiceConfig(serviceName);
const logger = createLogger(serviceName);
const databaseUrl =
  config.databaseUrl ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";
const redisUrl = config.redisUrl ?? "redis://localhost:6379";
const db = createDb(databaseUrl);
const publisher = new BullMqQueuePublisher({ redisUrl, prefix: "viralforge-local" });
const owner = `scheduler-${randomUUID().slice(0, 8)}`;
const timerRef: { current?: ReturnType<typeof setInterval> } = {};

async function tick(): Promise<void> {
  const result = await dispatchOutboxBatch({
    owner,
    publisher,
    store: {
      claimBatch: async (o, limit, leaseSeconds) => {
        const rows = await claimOutboxBatch(db, o, limit, leaseSeconds);
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
  if (result.published > 0 || result.errors > 0) {
    logger.info("outbox dispatch", { ...result, owner });
  }
}

const runtime = await startServiceRuntime({
  serviceName,
  port: Number(process.env.PORT ?? 4001),
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
    if (timerRef.current) clearInterval(timerRef.current);
    await publisher.close();
    logger.info("shutting down");
  },
});

timerRef.current = setInterval(() => {
  void tick().catch((error) => {
    logger.error("outbox tick failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  });
}, 1000);

logger.info("listening", { ...toLogSafeConfig(config), owner, framework: "outbox-dispatcher" });

export { runtime, tick };
export type { JobEnvelope };
