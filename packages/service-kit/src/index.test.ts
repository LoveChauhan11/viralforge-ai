import { describe, expect, it } from "vitest";
import { startServiceRuntime } from "./index.js";

async function get(port: number, path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return { status: res.status, body: await res.text() };
}

describe("startServiceRuntime", () => {
  it("serves live and ready endpoints and shuts down", async () => {
    const runtime = await startServiceRuntime({
      serviceName: "test-service",
      port: 0,
      host: "127.0.0.1",
      ready: async () => ({
        status: "ok",
        service: "test-service",
        checks: { self: "up" },
      }),
    });

    const address = runtime.server.address();
    if (!address || typeof address === "string") {
      throw new Error("expected TCP address");
    }

    const live = await get(address.port, "/health/live");
    expect(live.status).toBe(200);
    expect(live.body).toContain("test-service");

    const ready = await get(address.port, "/health/ready");
    expect(ready.status).toBe(200);

    await runtime.close();
  });

  it("returns 503 when readiness reports unavailable", async () => {
    const runtime = await startServiceRuntime({
      serviceName: "test-service",
      port: 0,
      host: "127.0.0.1",
      ready: async () => ({ status: "unavailable", service: "test-service" }),
    });
    const address = runtime.server.address();
    if (!address || typeof address === "string") {
      throw new Error("expected TCP address");
    }
    const ready = await get(address.port, "/health/ready");
    expect(ready.status).toBe(503);
    await runtime.close();
  });
});
