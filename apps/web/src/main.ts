import { createLogger } from "@viralforge/observability";
import { startServiceRuntime } from "@viralforge/service-kit";

const serviceName = "web";
const logger = createLogger(serviceName);
const port = Number(process.env.PORT ?? 3000);

const runtime = await startServiceRuntime({
  serviceName,
  port,
  ready: async () => ({
    status: "ok",
    service: serviceName,
    checks: { process: "up" },
  }),
  onShutdown: async () => {
    logger.info("shutting down");
  },
});

logger.info("listening", { port });

export { runtime };
