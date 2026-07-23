/** Shared public/internal contract markers. Expanded in later Sprint 0 tasks. */
export const CONTRACTS_VERSION = "0.0.0" as const;

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  requestId?: string;
};
