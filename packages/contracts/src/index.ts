/** Shared public/internal contract markers. */
export const CONTRACTS_VERSION = "0.0.0" as const;

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  errors?: Array<{ path: string; message: string }>;
};

export function problem(
  status: number,
  title: string,
  options: {
    type?: string;
    detail?: string;
    instance?: string;
    requestId?: string;
    errors?: Array<{ path: string; message: string }>;
  } = {},
): ProblemDetails {
  const body: ProblemDetails = {
    type: options.type ?? `https://viralforge.local/problems/${status}`,
    title,
    status,
  };
  if (options.detail) body.detail = options.detail;
  if (options.instance) body.instance = options.instance;
  if (options.requestId) body.requestId = options.requestId;
  if (options.errors) body.errors = options.errors;
  return body;
}

/** Cursor pagination conventions for list endpoints. */
export type CursorPageQuery = {
  limit?: number;
  cursor?: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export function normalizePageLimit(raw: unknown): number {
  const n =
    typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : DEFAULT_PAGE_LIMIT;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.floor(n), MAX_PAGE_LIMIT);
}
