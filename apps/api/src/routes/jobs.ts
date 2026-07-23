import { AuthError, authorize } from "@viralforge/auth";
import { cancelJob, createJobWithOutbox, getJob } from "@viralforge/database";
import { QUEUE_GENERAL } from "@viralforge/queue";
import { withSpan } from "@viralforge/observability";
import { context, trace } from "@opentelemetry/api";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ApiDeps } from "../deps.js";

const workspaceParams = z.object({
  workspaceId: z.string().uuid(),
});

const jobParams = z.object({
  workspaceId: z.string().uuid(),
  jobId: z.string().uuid(),
});

const createBody = z.object({
  idempotencyKey: z.string().min(1).max(160),
  mode: z.enum(["succeed", "fail", "timeout"]).default("succeed"),
  message: z.string().max(200).optional(),
});

function headerStore(headers: Record<string, string | string[] | undefined>) {
  return {
    get(name: string): string | undefined {
      const value = headers[name.toLowerCase()];
      return Array.isArray(value) ? value[0] : value;
    },
  };
}

function toJobView(job: NonNullable<Awaited<ReturnType<typeof getJob>>>) {
  return {
    id: job.id,
    workspaceId: job.workspaceId,
    type: job.type,
    state: job.state,
    stage: job.stage,
    progress: job.progress,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    idempotencyKey: job.idempotencyKey,
    safeErrorCode: job.safeErrorCode,
    result: job.result,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    finishedAt: job.finishedAt,
  };
}

export async function registerJobRoutes(app: FastifyInstance, deps: ApiDeps): Promise<void> {
  app.post("/v1/workspaces/:workspaceId/jobs/foundation", async (request, reply) => {
    const params = workspaceParams.parse(request.params);
    const body = createBody.parse(request.body ?? {});
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    const { membership } = await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "job:create",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "job",
    });

    const createUnderHttp = async () =>
      withSpan(
        "job.create",
        {
          workspaceId: membership.workspaceId,
          "job.type": "foundation.sample",
          requestId: request.requestId,
        },
        async (span) => {
          const result = await createJobWithOutbox(deps.db, {
            workspaceId: membership.workspaceId,
            type: "foundation.sample",
            idempotencyKey: body.idempotencyKey,
            queue: QUEUE_GENERAL,
            requestId: request.requestId,
            requestedBy: membership.userId,
            ...(request.traceparent ? { traceparent: request.traceparent } : {}),
            payload: {
              mode: body.mode,
              message: body.message ?? "foundation",
            },
          });
          span.setAttribute("jobId", result.jobId);
          span.setAttribute("job.created", result.created);
          return result;
        },
      );

    const created = request.otelSpan
      ? await context.with(trace.setSpan(context.active(), request.otelSpan), createUnderHttp)
      : await createUnderHttp();

    const job = await getJob(deps.db, created.jobId, membership.workspaceId);
    if (!job) {
      throw new Error("job missing after create");
    }

    void reply.status(created.created ? 201 : 200);
    return {
      job: toJobView(job),
      created: created.created,
      requestId: request.requestId,
    };
  });

  app.get("/v1/workspaces/:workspaceId/jobs/:jobId", async (request) => {
    const params = jobParams.parse(request.params);
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "job:read",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "job",
      targetId: params.jobId,
    });

    const job = await getJob(deps.db, params.jobId, params.workspaceId);
    if (!job) {
      throw new AuthError("not_found", "Job not found");
    }
    return { job: toJobView(job), requestId: request.requestId };
  });

  app.post("/v1/workspaces/:workspaceId/jobs/:jobId/cancel", async (request) => {
    const params = jobParams.parse(request.params);
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "job:cancel",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "job",
      targetId: params.jobId,
    });

    const result = await cancelJob(deps.db, params.jobId, params.workspaceId);
    const job = await getJob(deps.db, params.jobId, params.workspaceId);
    if (!job) {
      throw new AuthError("not_found", "Job not found");
    }
    return {
      cancelled: result.cancelled,
      job: toJobView(job),
      requestId: request.requestId,
    };
  });
}
