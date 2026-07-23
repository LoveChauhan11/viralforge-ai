import { createLogger } from "@viralforge/observability";
import { InMemoryQueuePublisher } from "@viralforge/queue";
import { startServiceRuntime } from "@viralforge/service-kit";

const serviceName = "worker-general";
const logger = createLogger(serviceName);
const port = Number(process.env.PORT ?? 4004);
const queue = new InMemoryQueuePublisher();

const runtime = await startServiceRuntime({
  serviceName,
  port,
  ready: async () => ({
    status: "ok",
    service: serviceName,
    checks: { process: "up", queue: "up" },
  }),
  onShutdown: async () => {
    logger.info("shutting down", { published: queue.published.length });
  },
});

logger.info("listening", { port });

export { runtime, queue };
