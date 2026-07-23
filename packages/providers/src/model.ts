import { z } from "zod";
import {
  consumeBudget,
  createBudget,
  type ProviderBudget,
  type ProviderCapability,
  ProviderError,
  withTimeout,
} from "./common.js";

const completeInput = z.object({
  prompt: z.string().min(1).max(50_000),
  requestId: z.string().optional(),
});

const completeOutput = z.object({
  text: z.string(),
  model: z.string(),
  usage: z.object({
    inputChars: z.number().int().nonnegative(),
    outputChars: z.number().int().nonnegative(),
  }),
});

export type ModelCompleteInput = z.infer<typeof completeInput>;
export type ModelCompleteOutput = z.infer<typeof completeOutput>;

export interface ModelProvider {
  readonly capability: ProviderCapability;
  complete(input: ModelCompleteInput): Promise<ModelCompleteOutput>;
}

export class FakeModelProvider implements ModelProvider {
  readonly capability: ProviderCapability = {
    name: "model",
    mode: "fake",
    maxTimeoutMs: 5_000,
  };
  readonly budget: ProviderBudget;

  constructor(budget: ProviderBudget = createBudget()) {
    this.budget = budget;
  }

  async complete(raw: ModelCompleteInput): Promise<ModelCompleteOutput> {
    const parsed = completeInput.safeParse(raw);
    if (!parsed.success) {
      throw new ProviderError("invalid_input", "model", "invalid model input", {
        retryable: false,
      });
    }
    consumeBudget(this.budget, "model", parsed.data.prompt.length);
    const result = await withTimeout("model", this.capability.maxTimeoutMs ?? 5_000, async () => {
      const text = `fake-response:${parsed.data.prompt.slice(0, 32)}`;
      return completeOutput.parse({
        text,
        model: "fake-model-v0",
        usage: { inputChars: parsed.data.prompt.length, outputChars: text.length },
      });
    });
    return result;
  }
}
