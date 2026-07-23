import type { AuthProvider, AuthzAuditWriter, MembershipStore } from "@viralforge/auth";
import type { Database } from "@viralforge/database";
import type { Logger, TelemetryHandle } from "@viralforge/observability";
import type { AppEnv } from "@viralforge/config";
import type { ObjectStorage } from "@viralforge/storage";

export type UploadLimits = {
  maxUploadBytes: number;
  uploadPartBytes: number;
  uploadSessionTtlHours: number;
  signedUrlTtlSeconds: number;
  maxWorkspaceAssets: number;
};

export type ApiDeps = {
  serviceName: string;
  appEnv: AppEnv;
  databaseUrl: string;
  db: Database;
  auth: AuthProvider;
  memberships: MembershipStore;
  audit: AuthzAuditWriter;
  logger: Logger;
  telemetry?: TelemetryHandle;
  storage?: ObjectStorage;
  uploadLimits?: UploadLimits;
  /** Optional override for readiness (tests). */
  pingDatabase?: (url: string) => Promise<void>;
  /** Rate-limit hook; throw or send 429. Default is no-op. */
  rateLimit?: (requestId: string, route: string) => void | Promise<void>;
};
