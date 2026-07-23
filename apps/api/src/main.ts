import {
  createLocalAuthProvider,
  LOCAL_USER_HEADER,
  type AuthProvider,
} from "@viralforge/auth";
import { loadServiceConfig, toLogSafeConfig, type AppEnv } from "@viralforge/config";
import {
  createDb,
  findActiveMembership,
  recordAuthzAudit,
  userExists,
} from "@viralforge/database";
import { createLogger } from "@viralforge/observability";
import { buildApiApp } from "./app.js";

const serviceName = "api";
const config = loadServiceConfig(serviceName);
const logger = createLogger(serviceName);

if (config.authProvider !== "local") {
  throw new Error(`AUTH_PROVIDER=${config.authProvider} is not implemented yet (S0-06 local only).`);
}

const databaseUrl =
  config.databaseUrl ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";
const db = createDb(databaseUrl);

const auth: AuthProvider = createLocalAuthProvider({
  appEnv: config.appEnv as AppEnv,
  userExists: (id) => userExists(db, id),
});

const app = await buildApiApp({
  serviceName,
  appEnv: config.appEnv,
  databaseUrl,
  db,
  auth,
  memberships: {
    findActiveMembership: (workspaceId, userId) =>
      findActiveMembership(db, workspaceId, userId),
  },
  audit: {
    record: (event) => recordAuthzAudit(db, event),
  },
  logger,
  rateLimit: async () => {
    // Hook only — Redis-backed limiter arrives with quota work.
  },
});

await app.listen({ port: config.port, host: "0.0.0.0" });

logger.info("listening", {
  ...toLogSafeConfig(config),
  port: config.port,
  localUserHeader: LOCAL_USER_HEADER,
  framework: "fastify",
});

const close = async (): Promise<void> => {
  await app.close();
};

process.once("SIGTERM", () => {
  void close().finally(() => process.exit(0));
});
process.once("SIGINT", () => {
  void close().finally(() => process.exit(0));
});

export { app, config, auth, close };
