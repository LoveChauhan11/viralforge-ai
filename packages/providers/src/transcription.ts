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
  workspaceId: z.string().uuid(),
  objectKey: z.string().min(1),
  languageHint: z.string().min(2).max(16).optional(),
});

const outputSchema = z.object({
  text: z.string(),
  language: z.string(),
  durationMs: z.number().int().nonnegative(),
});

export type TranscribeInput = z.infer<typeof inputSchema>;
export type TranscribeOutput = z.infer<typeof outputSchema>;

export interface TranscriptionProvider {
  readonly capability: ProviderCapability;
  transcribe(input: TranscribeInput): Promise<TranscribeOutput>;
}

export class FakeTranscriptionProvider implements TranscriptionProvider {
  readonly capability: ProviderCapability = {
    name: "transcription",
    mode: "fake",
    maxTimeoutMs: 10_000,
  };
  readonly budget: ProviderBudget;

  constructor(budget: ProviderBudget = createBudget()) {
    this.budget = budget;
  }

  async transcribe(raw: TranscribeInput): Promise<TranscribeOutput> {
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ProviderError("invalid_input", "transcription", "invalid transcription input", {
        retryable: false,
      });
    }
    if (!parsed.data.objectKey.startsWith(`${parsed.data.workspaceId}/`)) {
      throw new ProviderError("rejected", "transcription", "object key not workspace-scoped", {
        retryable: false,
      });
    }
    consumeBudget(this.budget, "transcription", parsed.data.objectKey.length);
    return withTimeout("transcription", this.capability.maxTimeoutMs ?? 10_000, async () =>
      outputSchema.parse({
        text: `fake-transcript:${parsed.data.objectKey}`,
        language: parsed.data.languageHint ?? "en",
        durationMs: 1_200,
      }),
    );
  }
}
