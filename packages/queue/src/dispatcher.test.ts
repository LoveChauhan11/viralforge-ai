import { describe, expect, it } from "vitest";
import { dispatchOutboxBatch, InMemoryQueuePublisher } from "./index.js";
import type { OutboxStore, ClaimedOutboxEvent } from "./dispatcher.js";

describe("dispatchOutboxBatch", () => {
  it("publishes claimed events once and marks published", async () => {
    const events: ClaimedOutboxEvent[] = [
      {
        id: "o1",
        workspaceId: "w1",
        attempts: 1,
        payload: {
          queueName: "viralforge-general",
          envelope: {
            jobId: "j1",
            workspaceId: "w1",
            type: "foundation.sample",
            idempotencyKey: "k1",
            payload: {},
          },
        },
      },
    ];
    const publishedIds: string[] = [];
    const store: OutboxStore = {
      claimBatch: async () => events.splice(0, events.length),
      markPublished: async (id) => {
        publishedIds.push(id);
      },
      markDispatchError: async () => undefined,
    };
    const publisher = new InMemoryQueuePublisher();

    const first = await dispatchOutboxBatch({ store, publisher, owner: "sched-1" });
    expect(first.published).toBe(1);
    expect(publisher.published).toHaveLength(1);
    expect(publishedIds).toEqual(["o1"]);

    const second = await dispatchOutboxBatch({ store, publisher, owner: "sched-1" });
    expect(second.published).toBe(0);
    expect(publisher.published).toHaveLength(1);
  });

  it("dedupes duplicate publish calls for same outbox id", async () => {
    const publisher = new InMemoryQueuePublisher();
    const envelope = {
      jobId: "j1",
      workspaceId: "w1",
      type: "foundation.sample",
      idempotencyKey: "k1",
      payload: {},
      outboxEventId: "o1",
    };
    await publisher.publish("viralforge-general", envelope);
    await publisher.publish("viralforge-general", envelope);
    expect(publisher.published).toHaveLength(1);
  });
});
