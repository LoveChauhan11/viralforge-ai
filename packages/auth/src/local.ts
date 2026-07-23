import { AuthError } from "./errors.js";
import type { AuthProvider, AuthRequestHeaders, Principal } from "./types.js";

export const LOCAL_USER_HEADER = "x-viralforge-user-id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LocalAuthOptions = {
  appEnv: "local" | "test" | "ci" | "staging" | "production";
  /** Optional existence check so unknown user IDs authenticate as null (401), not forged principals. */
  userExists?: (userId: string) => Promise<boolean>;
};

/**
 * Local-only adapter. Spoofs identity via header for development/CI.
 * Must never be constructed for staging/production.
 */
export function createLocalAuthProvider(options: LocalAuthOptions): AuthProvider {
  if (options.appEnv === "staging" || options.appEnv === "production") {
    throw new Error(
      "Local auth adapter cannot be enabled in staging/production (AUTH_PROVIDER=local forbidden).",
    );
  }

  return {
    name: "local",
    async authenticate(headers: AuthRequestHeaders): Promise<Principal | null> {
      const raw = headers.get(LOCAL_USER_HEADER)?.trim();
      if (!raw) return null;
      if (!UUID_RE.test(raw)) {
        throw new AuthError("unauthenticated", "Invalid local user identity");
      }
      if (options.userExists && !(await options.userExists(raw))) {
        return null;
      }
      return { userId: raw, authProvider: "local" };
    },
  };
}
