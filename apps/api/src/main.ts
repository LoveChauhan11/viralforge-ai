import { loadServiceConfig, toLogSafeConfig } from "@viralforge/config";
import { createLogger } from "@viralforge/observability";
import { startServiceRuntime } from "@viralforge/service-kit";

const serviceName = "api";
const config = loadServiceConfig(serviceName);
const logger = createLogger(serviceName);

const runtime = await startServiceRuntime({
  serviceName,
  port: config.port,
  ready: async () => ({
    status: "ok",
    service: serviceName,
    checks: {
      process: "up",
    },
  }),
  onShutdown: async () => {
    logger.info("shutting down");
  },
});

logger.info("listening", { ...toLogSafeConfig(config), port: config.port });

export { runtime, config };
