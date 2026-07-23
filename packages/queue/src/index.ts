/** Queue contracts. BullMQ wiring lands in S0-08. */
export type JobEnvelope<TPayload = unknown> = {
  jobId: string;
  workspaceId: string;
  type: string;
  idempotencyKey: string;
  payload: TPayload;
  requestId?: string;
};

export interface QueuePublisher {
  publish<T>(queueName: string, envelope: JobEnvelope<T>): Promise<void>;
}

export class InMemoryQueuePublisher implements QueuePublisher {
  readonly published: Array<{ queueName: string; envelope: JobEnvelope }> = [];

  async publish<T>(queueName: string, envelope: JobEnvelope<T>): Promise<void> {
    this.published.push({ queueName, envelope });
  }
}
