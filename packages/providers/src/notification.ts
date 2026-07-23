import { z } from "zod";
import {
  consumeBudget,
  createBudget,
  type ProviderBudget,
  type ProviderCapability,
  ProviderError,
  withTimeout,
} from "./common.js";

const inputSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000),
});

export type NotifyInput = z.infer<typeof inputSchema>;

export interface NotificationProvider {
  readonly capability: ProviderCapability;
  send(input: NotifyInput): Promise<{ delivered: boolean }>;
}

export class FakeNotificationProvider implements NotificationProvider {
  readonly capability: ProviderCapability = {
    name: "notification",
    mode: "fake",
    maxTimeoutMs: 2_000,
  };
  readonly budget: ProviderBudget;
  readonly sent: NotifyInput[] = [];

  constructor(budget: ProviderBudget = createBudget()) {
    this.budget = budget;
  }

  async send(raw: NotifyInput): Promise<{ delivered: boolean }> {
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ProviderError("invalid_input", "notification", "invalid notification input", {
        retryable: false,
      });
    }
    consumeBudget(this.budget, "notification", parsed.data.body.length);
    return withTimeout("notification", this.capability.maxTimeoutMs ?? 2_000, async () => {
      this.sent.push(parsed.data);
      return { delivered: true };
    });
  }
}
