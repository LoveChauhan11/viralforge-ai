export type ProviderErrorCode =
  | "timeout"
  | "budget_exceeded"
  | "unavailable"
  | "invalid_input"
  | "rejected";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly provider: string;
  readonly retryable: boolean;

  constructor(
    code: ProviderErrorCode,
    provider: string,
    message: string,
    options?: { retryable?: boolean; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "ProviderError";
    this.code = code;
    this.provider = provider;
    this.retryable = options?.retryable ?? (code === "timeout" || code === "unavailable");
  }
}

export type ProviderCapability = {
  name: string;
  mode: "fake" | "live";
  supportsStreaming?: boolean;
  maxTimeoutMs?: number;
};

export type ProviderBudget = {
  maxCalls: number;
  maxInputChars: number;
  callsUsed: number;
  inputCharsUsed: number;
};

export function createBudget(maxCalls = 100, maxInputChars = 200_000): ProviderBudget {
  return { maxCalls, maxInputChars, callsUsed: 0, inputCharsUsed: 0 };
}

export function consumeBudget(
  budget: ProviderBudget,
  provider: string,
  inputChars: number,
): void {
  if (budget.callsUsed >= budget.maxCalls) {
    throw new ProviderError("budget_exceeded", provider, "call budget exceeded", {
      retryable: false,
    });
  }
  if (budget.inputCharsUsed + inputChars > budget.maxInputChars) {
    throw new ProviderError("budget_exceeded", provider, "input budget exceeded", {
      retryable: false,
    });
  }
  budget.callsUsed += 1;
  budget.inputCharsUsed += inputChars;
}

export async function withTimeout<T>(
  provider: string,
  ms: number,
  work: () => Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new ProviderError("timeout", provider, `timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const SENSITIVE_KEY = /(secret|token|password|authorization|api[_-]?key|signed[_-]?url|email)/i;

export function redactProviderFields(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      out[key] = redactProviderFields(raw as Record<string, unknown>);
    } else {
      out[key] = raw;
    }
  }
  return out;
}
