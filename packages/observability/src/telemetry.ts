import {
  context,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  metrics,
  propagation,
  SpanStatusCode,
  trace,
  type Span,
  type Tracer,
} from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { Resource } from "@opentelemetry/resources";
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { localMetrics } from "./metrics-registry.js";

export type TelemetryHandle = {
  serviceName: string;
  tracer: Tracer;
  spanExporter: InMemorySpanExporter;
  metricExporter: InMemoryMetricExporter;
  meterProvider: MeterProvider;
  tracerProvider: BasicTracerProvider;
  shutdown(): Promise<void>;
};

let active: TelemetryHandle | null = null;
let contextManagerReady = false;

function ensureContextManager(): void {
  if (contextManagerReady) return;
  context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
  contextManagerReady = true;
}

export function getTelemetry(): TelemetryHandle | null {
  return active;
}

export function initTelemetry(serviceName: string, options?: { debug?: boolean }): TelemetryHandle {
  if (active?.serviceName === serviceName) return active;

  ensureContextManager();
  if (options?.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
  });

  const spanExporter = new InMemorySpanExporter();
  const tracerProvider = new BasicTracerProvider({ resource });
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(spanExporter));
  trace.setGlobalTracerProvider(tracerProvider);

  const metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 500,
      }),
    ],
  });
  metrics.setGlobalMeterProvider(meterProvider);

  const meter = metrics.getMeter("viralforge");
  meter.createHistogram("viralforge.job.duration_ms");
  meter.createCounter("viralforge.job.terminal");
  meter.createHistogram("viralforge.queue.depth");
  meter.createHistogram("viralforge.queue.oldest_age_ms");
  meter.createCounter("viralforge.provider.calls");

  const handle: TelemetryHandle = {
    serviceName,
    tracer: trace.getTracer("viralforge", "0.0.0"),
    spanExporter,
    metricExporter,
    meterProvider,
    tracerProvider,
    async shutdown() {
      await meterProvider.shutdown();
      await tracerProvider.shutdown();
      if (active === handle) active = null;
    },
  };

  active = handle;
  return handle;
}

export async function shutdownTelemetry(): Promise<void> {
  if (!active) return;
  await active.shutdown();
}

export type SpanAttributes = Record<string, string | number | boolean | undefined>;

export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  work: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = active?.tracer ?? trace.getTracer("viralforge");
  return tracer.startActiveSpan(name, async (span) => {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) span.setAttribute(key, value);
    }
    try {
      const result = await work(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "error",
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
}

export function injectTraceContext(): { traceparent?: string; tracestate?: string } {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  const out: { traceparent?: string; tracestate?: string } = {};
  if (carrier.traceparent) out.traceparent = carrier.traceparent;
  if (carrier.tracestate) out.tracestate = carrier.tracestate;
  return out;
}

export async function withExtractedContext<T>(
  carrier: Record<string, string | undefined>,
  work: () => Promise<T>,
): Promise<T> {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(carrier)) {
    if (v) cleaned[k] = v;
  }
  const extracted = propagation.extract(context.active(), cleaned);
  return context.with(extracted, work);
}

export function getFinishedSpans(): ReadableSpan[] {
  return active?.spanExporter.getFinishedSpans() ?? [];
}

export function resetSpans(): void {
  active?.spanExporter.reset();
  localMetrics.reset();
}

export function recordJobTerminal(outcome: string, jobType: string, durationMs: number): void {
  localMetrics.record("viralforge.job.duration_ms", durationMs, { job_type: jobType, outcome });
  localMetrics.add("viralforge.job.terminal", 1, { job_type: jobType, outcome });
  const meter = metrics.getMeter("viralforge");
  meter.createHistogram("viralforge.job.duration_ms").record(durationMs, {
    job_type: jobType,
    outcome,
  });
  meter.createCounter("viralforge.job.terminal").add(1, { job_type: jobType, outcome });
}

export function recordQueueSample(depth: number, oldestAgeMs: number, queue: string): void {
  localMetrics.record("viralforge.queue.depth", depth, { queue });
  localMetrics.record("viralforge.queue.oldest_age_ms", oldestAgeMs, { queue });
  const meter = metrics.getMeter("viralforge");
  meter.createHistogram("viralforge.queue.depth").record(depth, { queue });
  meter.createHistogram("viralforge.queue.oldest_age_ms").record(oldestAgeMs, { queue });
}

export function recordProviderCall(provider: string, result: "ok" | "error"): void {
  localMetrics.add("viralforge.provider.calls", 1, { provider, result });
  metrics.getMeter("viralforge").createCounter("viralforge.provider.calls").add(1, {
    provider,
    result,
  });
}
