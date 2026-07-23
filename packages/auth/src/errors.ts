import type { ProblemDetails } from "@viralforge/contracts";

export type AuthErrorCode = "unauthenticated" | "forbidden" | "not_found";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = code === "unauthenticated" ? 401 : code === "forbidden" ? 403 : 404;
  }

  toProblemDetails(requestId?: string): ProblemDetails {
    const titles = {
      unauthenticated: "Unauthorized",
      forbidden: "Forbidden",
      not_found: "Not Found",
    } as const;
    const problem: ProblemDetails = {
      type: `https://viralforge.local/problems/${this.code}`,
      title: titles[this.code],
      status: this.status,
      detail: this.message,
    };
    if (requestId) problem.requestId = requestId;
    return problem;
  }
}
