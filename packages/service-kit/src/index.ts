import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

export type HealthStatus = {
  status: "ok" | "degraded" | "unavailable";
  service: string;
  checks?: Record<string, "up" | "down">;
};

export type ServiceRuntimeOptions = {
  serviceName: string;
  port: number;
  host?: string;
  /** Liveness: process is up. */
  live?: () => HealthStatus | Promise<HealthStatus>;
  /** Readiness: dependencies available. */
  ready?: () => HealthStatus | Promise<HealthStatus>;
  /** Application routes. Return true if handled. */
  handleRequest?: (req: IncomingMessage, res: ServerResponse) => boolean | Promise<boolean>;
  onShutdown?: () => void | Promise<void>;
  shutdownTimeoutMs?: number;
};

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

export { sendJson };

async function handleHealth(
  req: IncomingMessage,
  res: ServerResponse,
  options: ServiceRuntimeOptions,
): Promise<boolean> {
  const url = req.url ?? "/";
  if (req.method !== "GET") return false;

  if (url === "/health/live" || url === "/healthz") {
    const body = options.live
      ? await options.live()
      : { status: "ok" as const, service: options.serviceName };
    sendJson(res, 200, body);
    return true;
  }

  if (url === "/health/ready" || url === "/readyz") {
    const body = options.ready
      ? await options.ready()
      : { status: "ok" as const, service: options.serviceName };
    const code = body.status === "unavailable" ? 503 : 200;
    sendJson(res, code, body);
    return true;
  }

  if (url === "/health") {
    sendJson(res, 200, { status: "ok", service: options.serviceName });
    return true;
  }

  return false;
}

/**
 * Boots a minimal HTTP process with live/ready health and SIGTERM/SIGINT shutdown.
 * Framework-specific servers (Fastify/Next) can replace this in later tasks while keeping the contract.
 */
export async function startServiceRuntime(options: ServiceRuntimeOptions): Promise<{
  server: Server;
  close: () => Promise<void>;
}> {
  const host = options.host ?? "0.0.0.0";
  const shutdownTimeoutMs = options.shutdownTimeoutMs ?? 10_000;
  let shuttingDown = false;

  const server = createServer((req, res) => {
    void (async () => {
      try {
        if (shuttingDown) {
          sendJson(res, 503, { status: "unavailable", service: options.serviceName });
          return;
        }
        const handled = await handleHealth(req, res, options);
        if (handled) return;
        const appHandled = options.handleRequest ? await options.handleRequest(req, res) : false;
        if (!appHandled) {
          sendJson(res, 404, {
            type: "about:blank",
            title: "Not Found",
            status: 404,
            detail: `No route for ${req.method ?? "GET"} ${req.url ?? "/"}`,
          });
        }
      } catch (error) {
        sendJson(res, 500, {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: error instanceof Error ? error.message : "unknown",
        });
      }
    })();
  });

  const close = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    await Promise.race([
      (async () => {
        await options.onShutdown?.();
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
      })(),
      new Promise<void>((resolve) => {
        setTimeout(resolve, shutdownTimeoutMs);
      }),
    ]);
  };

  const onSignal = (): void => {
    void close().finally(() => process.exit(0));
  };
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, host, () => resolve());
  });

  return { server, close };
}
