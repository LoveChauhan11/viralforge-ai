export const QUEUE_GENERAL = "viralforge-general";
export const QUEUE_DLQ = "viralforge-dlq";

export type JobEnvelope<TPayload = unknown> = {
  jobId: string;
  workspaceId: string;
  type: string;
  idempotencyKey: string;
  payload: TPayload;
  requestId?: string;
  outboxEventId?: string;
};

export type OutboxPublishPayload = {
  queueName: string;
  envelope: JobEnvelope;
};

export interface QueuePublisher {
  publish<T>(queueName: string, envelope: JobEnvelope<T>): Promise<void>;
  close?(): Promise<void>;
}

export class InMemoryQueuePublisher implements QueuePublisher {
  readonly published: Array<{ queueName: string; envelope: JobEnvelope }> = [];

  async publish<T>(queueName: string, envelope: JobEnvelope<T>): Promise<void> {
    const exists = this.published.some(
      (p) =>
        p.queueName === queueName &&
        (p.envelope.outboxEventId
          ? p.envelope.outboxEventId === envelope.outboxEventId
          : p.envelope.jobId === envelope.jobId &&
            p.envelope.idempotencyKey === envelope.idempotencyKey),
    );
    if (!exists) {
      this.published.push({ queueName, envelope });
    }
  }
}
