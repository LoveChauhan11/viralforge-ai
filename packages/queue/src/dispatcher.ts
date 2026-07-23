import { recordQueueSample, withExtractedContext, withSpan } from "@viralforge/observability";
import type { JobEnvelope, QueuePublisher } from "./types.js";

export type ClaimedOutboxEvent = {
  id: string;
  workspaceId: string;
  payload: {
    queueName: string;
    envelope: JobEnvelope;
  };
  attempts: number;
};

export type OutboxStore = {
  claimBatch(owner: string, limit: number, leaseSeconds: number): Promise<ClaimedOutboxEvent[]>;
  markPublished(id: string): Promise<void>;
  markDispatchError(id: string, safeErrorCode: string): Promise<void>;
};

/**
 * Claims unpublished outbox rows and publishes them. Safe to run concurrently:
 * claim uses SKIP LOCKED; publish job ids are deterministic.
 */
export async function dispatchOutboxBatch(options: {
  store: OutboxStore;
  publisher: QueuePublisher;
  owner: string;
  limit?: number;
  leaseSeconds?: number;
}): Promise<{ published: number; errors: number }> {
  const limit = options.limit ?? 20;
  const leaseSeconds = options.leaseSeconds ?? 30;
  const claimed = await options.store.claimBatch(options.owner, limit, leaseSeconds);
  let published = 0;
  let errors = 0;

  recordQueueSample(claimed.length, 0, "outbox");

  for (const event of claimed) {
    const envelope = event.payload.envelope;
    try {
      await withExtractedContext({ traceparent: envelope.traceparent }, async () => {
        await withSpan(
          "outbox.dispatch",
          {
            outboxEventId: event.id,
            jobId: envelope.jobId,
            workspaceId: event.workspaceId,
            queue: event.payload.queueName,
          },
          async () => {
            await options.publisher.publish(event.payload.queueName, {
              ...envelope,
              outboxEventId: event.id,
            });
            await options.store.markPublished(event.id);
          },
        );
      });
      published += 1;
    } catch {
      await options.store.markDispatchError(event.id, "outbox_publish_failed");
      errors += 1;
    }
  }

  return { published, errors };
}
