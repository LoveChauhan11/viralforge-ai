import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { JobEnvelope, QueuePublisher } from "./types.js";
import { QUEUE_DLQ } from "./types.js";

export type BullMqPublisherOptions = {
  redisUrl: string;
  prefix?: string;
};

export class BullMqQueuePublisher implements QueuePublisher {
  private readonly connection: Redis;
  private readonly queues = new Map<string, Queue>();
  private readonly prefix: string;

  constructor(options: BullMqPublisherOptions) {
    this.prefix = options.prefix ?? "viralforge";
    this.connection = new Redis(options.redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  private queue(name: string): Queue {
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, {
        connection: this.connection,
        prefix: this.prefix,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: 1000,
          removeOnFail: false,
        },
      });
      this.queues.set(name, q);
    }
    return q;
  }

  async publish<T>(queueName: string, envelope: JobEnvelope<T>): Promise<void> {
    const jobId = envelope.outboxEventId ?? `${envelope.jobId}:${envelope.idempotencyKey}`;
    try {
      await this.queue(queueName).add(envelope.type, envelope, {
        jobId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/already exists|Job with this id already exists/i.test(message)) {
        throw error;
      }
    }
  }

  async moveToDlq(envelope: JobEnvelope, safeErrorCode: string): Promise<void> {
    await this.queue(QUEUE_DLQ).add(
      "dead-letter",
      { envelope, safeErrorCode },
      { jobId: `dlq:${envelope.outboxEventId ?? envelope.jobId}` },
    );
  }

  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    await this.connection.quit();
  }
}
