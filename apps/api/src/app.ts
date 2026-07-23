import { AuthError } from "@viralforge/auth";
import { problem } from "@viralforge/contracts";
import { pingDatabase as defaultPing } from "@viralforge/database";
import { getTelemetry } from "@viralforge/observability";
import { context, propagation, SpanStatusCode, trace, type Span } from "@opentelemetry/api";
import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { ApiDeps } from "./deps.js";
import { registerJobRoutes } from "./routes/jobs.js";
import { registerWorkspaceRoutes } from "./routes/workspaces.js";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
    otelSpan?: Span;
    traceparent?: string;
  }
}

async function readyHandler(
  deps: ApiDeps,
  ping: (url: string) => Promise<void>,
  reply: { status: (code: number) => unknown },
) {
  try {
    await ping(deps.databaseUrl);
    return {
      status: "ok" as const,
      service: deps.serviceName,
      checks: { process: "up" as const, database: "up" as const },
    };
  } catch {
    void reply.status(503);
    return {
      status: "unavailable" as const,
      service: deps.serviceName,
      checks: { process: "up" as const, database: "down" as const },
    };
  }
}

export async function buildApiApp(deps: ApiDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    trustProxy: true,
  });

  const ping = deps.pingDatabase ?? defaultPing;

  app.addHook("onRequest", async (request, reply) => {
    const inbound = request.headers["x-request-id"];
    const requestId =
      typeof inbound === "string" && inbound.trim().length > 0 ? inbound.trim() : randomUUID();
    request.requestId = requestId;
    void reply.header("x-request-id", requestId);

    if (deps.rateLimit) {
      await deps.rateLimit(requestId, `${request.method} ${request.url}`);
    }

    if (request.url.startsWith("/health")) return;

    const tracer = getTelemetry()?.tracer ?? trace.getTracer("viralforge");
    const parentCtx = propagation.extract(context.active(), {
      traceparent:
        typeof request.headers.traceparent === "string" ? request.headers.traceparent : undefined,
    });
    const span = tracer.startSpan(
      "http.request",
      {
        attributes: {
          "http.method": request.method,
          "http.route": request.routeOptions?.url ?? request.url,
          requestId,
        },
      },
      parentCtx,
    );
    request.otelSpan = span;
    const spanCtx = trace.setSpan(parentCtx, span);
    const carrier: Record<string, string> = {};
    propagation.inject(spanCtx, carrier);
    if (carrier.traceparent) {
      request.traceparent = carrier.traceparent;
      void reply.header("traceparent", carrier.traceparent);
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    deps.logger.info("request completed", {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
    });
    const span = request.otelSpan;
    if (span) {
      span.setAttribute("http.status_code", reply.statusCode);
      span.setStatus({
        code: reply.statusCode >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      });
      span.end();
    }
  });

  app.setErrorHandler((error, request, reply) => {
    const requestId = request.requestId ?? randomUUID();
    request.otelSpan?.recordException(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof AuthError) {
      void reply
        .status(error.status)
        .header("content-type", "application/problem+json; charset=utf-8")
        .send(error.toProblemDetails(requestId));
      return;
    }

    if (error instanceof ZodError) {
      void reply
        .status(400)
        .header("content-type", "application/problem+json; charset=utf-8")
        .send(
          problem(400, "Bad Request", {
            type: "https://viralforge.local/problems/validation",
            detail: "Request validation failed",
            requestId,
            errors: error.issues.map((issue) => ({
              path: issue.path.join(".") || "(root)",
              message: issue.message,
            })),
          }),
        );
      return;
    }

    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 429
    ) {
      void reply
        .status(429)
        .header("content-type", "application/problem+json; charset=utf-8")
        .send(problem(429, "Too Many Requests", { detail: "Rate limit exceeded", requestId }));
      return;
    }

    deps.logger.error("unhandled error", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    void reply
      .status(500)
      .header("content-type", "application/problem+json; charset=utf-8")
      .send(
        problem(500, "Internal Server Error", {
          detail: "An unexpected error occurred",
          requestId,
        }),
      );
  });

  app.get("/health/live", async () => ({
    status: "ok" as const,
    service: deps.serviceName,
  }));
  app.get("/healthz", async () => ({
    status: "ok" as const,
    service: deps.serviceName,
  }));
  app.get("/health", async () => ({
    status: "ok" as const,
    service: deps.serviceName,
  }));

  app.get("/health/ready", async (_request, reply) => readyHandler(deps, ping, reply));
  app.get("/readyz", async (_request, reply) => readyHandler(deps, ping, reply));

  await registerWorkspaceRoutes(app, deps);
  await registerJobRoutes(app, deps);

  return app;
}
