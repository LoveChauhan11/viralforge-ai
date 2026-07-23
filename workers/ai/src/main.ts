import { createLogger } from "@viralforge/observability";
import { FakeModelProvider } from "@viralforge/providers";
import { startServiceRuntime } from "@viralforge/service-kit";

const serviceName = "worker-ai";
const logger = createLogger(serviceName);
const port = Number(process.env.PORT ?? 4003);
const model = new FakeModelProvider();

const runtime = await startServiceRuntime({
  serviceName,
  port,
  ready: async () => ({
    status: "ok",
    service: serviceName,
    checks: { process: "up", model: model.capability.mode === "fake" ? "up" : "up" },
  }),
  onShutdown: async () => {
    logger.info("shutting down");
  },
});

logger.info("listening", { port, modelMode: model.capability.mode });

export { runtime };
