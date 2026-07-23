import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createLogger,
  getFinishedSpans,
  initTelemetry,
  injectTraceContext,
  localMetrics,
  recordJobTerminal,
  recordProviderCall,
  recordQueueSample,
  resetSpans,
  sanitizeLogFields,
  shutdownTelemetry,
  withExtractedContext,
  withSpan,
} from "./index.js";

describe("sanitizeLogFields", () => {
  it("redacts secrets and signed URLs", () => {
    expect(
      sanitizeLogFields({
        requestId: "r1",
        apiKey: "sk-secret",
        url: "https://minio.local/bucket/key?X-Amz-Signature=abc&Expires=1",
        nested: { accessToken: "tok", jobId: "j1" },
      }),
    ).toEqual({
      requestId: "r1",
      apiKey: "[redacted]",
      url: "https://minio.local/bucket/key?[redacted]",
      nested: { accessToken: "[redacted]", jobId: "j1" },
    });
  });
});

describe("logger sanitization", () => {
  it("never writes signed URL query strings", () => {
    const lines: string[] = [];
    const logger = createLogger("test", {}, (_level, service, message, fields) => {
      lines.push(JSON.stringify({ service, message, ...fields }));
    });
    logger.info("signed", {
      downloadUrl: "https://s3.example/o?X-Amz-Signature=deadbeef",
      email: "a@b.c",
    });
    expect(lines[0]).not.toContain("deadbeef");
    expect(lines[0]).toContain("[redacted]");
  });
});

describe("telemetry correlation", () => {
  beforeEach(() => {
    initTelemetry("observability-test");
    resetSpans();
  });

  afterEach(async () => {
    await shutdownTelemetry();
  });

  it("links API → outbox → worker spans via traceparent", async () => {
    let carrier: { traceparent?: string } = {};

    await withSpan(
      "http.request",
      { "http.route": "/jobs/foundation", requestId: "req-1" },
      async () => {
        await withSpan("job.create", { jobId: "job-1", workspaceId: "ws-1" }, async () => {
          carrier = injectTraceContext();
        });
      },
    );

    expect(carrier.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[0-9a-f]$/);

    await withExtractedContext(carrier, async () => {
      await withSpan("outbox.dispatch", { outboxEventId: "o1" }, async () => undefined);
      await withSpan(
        "job.process",
        { jobId: "job-1", "job.type": "foundation.sample" },
        async () => {
          recordJobTerminal("succeeded", "foundation.sample", 42);
        },
      );
    });

    const spans = getFinishedSpans().map((s) => s.name);
    expect(spans).toEqual(
      expect.arrayContaining(["http.request", "job.create", "outbox.dispatch", "job.process"]),
    );

    const create = getFinishedSpans().find((s) => s.name === "job.create");
    const process = getFinishedSpans().find((s) => s.name === "job.process");
    expect(create?.spanContext().traceId).toBe(process?.spanContext().traceId);

    expect(
      localMetrics.counterTotal("viralforge.job.terminal", {
        job_type: "foundation.sample",
        outcome: "succeeded",
      }),
    ).toBe(1);
    expect(
      localMetrics.histogramValues("viralforge.job.duration_ms", {
        job_type: "foundation.sample",
        outcome: "succeeded",
      })[0],
    ).toBe(42);

    recordQueueSample(3, 1500, "viralforge-general");
    recordProviderCall("model", "ok");
    expect(
      localMetrics.histogramValues("viralforge.queue.depth", { queue: "viralforge-general" }),
    ).toEqual([3]);
    expect(
      localMetrics.counterTotal("viralforge.provider.calls", { provider: "model", result: "ok" }),
    ).toBe(1);
  });
});
