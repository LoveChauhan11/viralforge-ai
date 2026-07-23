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
  niche: z.string().min(1).max(80),
  region: z.string().min(2).max(8).default("us"),
});

const trendSchema = z.object({
  id: z.string(),
  label: z.string(),
  confidence: z.number().min(0).max(1),
  evidenceFreshnessHours: z.number().int().nonnegative(),
});

export type ListTrendsInput = z.infer<typeof inputSchema>;
export type TrendItem = z.infer<typeof trendSchema>;

export interface TrendProvider {
  readonly capability: ProviderCapability;
  listTrends(input: ListTrendsInput): Promise<TrendItem[]>;
}

export class FakeTrendProvider implements TrendProvider {
  readonly capability: ProviderCapability = {
    name: "trends",
    mode: "fake",
    maxTimeoutMs: 3_000,
  };
  readonly budget: ProviderBudget;

  constructor(budget: ProviderBudget = createBudget()) {
    this.budget = budget;
  }

  async listTrends(raw: ListTrendsInput): Promise<TrendItem[]> {
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ProviderError("invalid_input", "trends", "invalid trend input", {
        retryable: false,
      });
    }
    consumeBudget(this.budget, "trends", parsed.data.niche.length);
    return withTimeout("trends", this.capability.maxTimeoutMs ?? 3_000, async () => [
      trendSchema.parse({
        id: "fake-trend-1",
        label: `${parsed.data.niche} hook pattern`,
        confidence: 0.55,
        evidenceFreshnessHours: 24,
      }),
    ]);
  }
}
