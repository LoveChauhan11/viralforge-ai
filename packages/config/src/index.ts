import { z } from "zod";

export type AppEnv = "local" | "test" | "ci" | "staging" | "production";

const appEnvSchema = z.enum(["local", "test", "ci", "staging", "production"]);
const nodeEnvSchema = z.enum(["development", "test", "staging", "production"]);

const SECRET_KEYS = new Set([
  "databaseUrl",
  "redisUrl",
  "authSessionSecret",
  "fieldEncryptionKey",
  "objectStorageAccessKeyId",
  "objectStorageSecretAccessKey",
  "aiApiKey",
  "youtubeClientSecret",
  "sentryDsn",
]);

export class ConfigError extends Error {
  readonly missing: string[];

  constructor(message: string, missing: string[] = []) {
    super(message);
    this.name = "ConfigError";
    this.missing = missing;
  }
}

function optionalString() {
  return z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));
}

const baseSchema = z.object({
  nodeEnv: nodeEnvSchema.default("development"),
  appEnv: appEnvSchema.default("local"),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  serviceName: z.string().min(1),
  publicWebUrl: z.string().url().default("http://localhost:3000"),
  apiBaseUrl: z.string().url().default("http://localhost:4000"),
  port: z.coerce.number().int().positive().default(4000),
  authProvider: z.enum(["local", "oidc"]).default("local"),
  aiProvider: z.enum(["fake", "openai"]).default("fake"),
  transcriptionProvider: z.enum(["fake", "live"]).default("fake"),
  trendProvider: z.enum(["manual", "live"]).default("manual"),
  notificationProvider: z.enum(["fake", "live"]).default("fake"),
  featurePublicPublishing: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  featureAutoDnaApply: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const secretsSchema = z.object({
  databaseUrl: optionalString(),
  redisUrl: optionalString(),
  authSessionSecret: optionalString(),
  fieldEncryptionKey: optionalString(),
  fieldEncryptionKeyVersion: z.coerce.number().int().positive().default(1),
  objectStorageEndpoint: z.string().url().default("http://localhost:9000"),
  objectStorageRegion: z.string().default("us-east-1"),
  objectStorageBucket: z.string().default("viralforge-local"),
  objectStorageAccessKeyId: optionalString(),
  objectStorageSecretAccessKey: optionalString(),
  objectStorageForcePathStyle: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  aiApiKey: optionalString(),
  youtubeClientId: optionalString(),
  youtubeClientSecret: optionalString(),
  sentryDsn: optionalString(),
});

export type ServiceConfig = z.infer<typeof baseSchema> & z.infer<typeof secretsSchema>;

function fromEnv(env: NodeJS.ProcessEnv): Record<string, unknown> {
  return {
    nodeEnv: env.NODE_ENV,
    appEnv: env.APP_ENV,
    logLevel: env.LOG_LEVEL,
    serviceName: env.SERVICE_NAME,
    publicWebUrl: env.PUBLIC_WEB_URL,
    apiBaseUrl: env.API_BASE_URL,
    port: env.PORT,
    authProvider: env.AUTH_PROVIDER,
    aiProvider: env.AI_PROVIDER,
    transcriptionProvider: env.TRANSCRIPTION_PROVIDER,
    trendProvider: env.TREND_PROVIDER,
    notificationProvider: env.NOTIFICATION_PROVIDER,
    featurePublicPublishing: env.FEATURE_PUBLIC_PUBLISHING,
    featureAutoDnaApply: env.FEATURE_AUTO_DNA_APPLY,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    authSessionSecret: env.AUTH_SESSION_SECRET,
    fieldEncryptionKey: env.FIELD_ENCRYPTION_KEY,
    fieldEncryptionKeyVersion: env.FIELD_ENCRYPTION_KEY_VERSION,
    objectStorageEndpoint: env.OBJECT_STORAGE_ENDPOINT,
    objectStorageRegion: env.OBJECT_STORAGE_REGION,
    objectStorageBucket: env.OBJECT_STORAGE_BUCKET,
    objectStorageAccessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID,
    objectStorageSecretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    objectStorageForcePathStyle: env.OBJECT_STORAGE_FORCE_PATH_STYLE,
    aiApiKey: env.AI_API_KEY,
    youtubeClientId: env.YOUTUBE_CLIENT_ID,
    youtubeClientSecret: env.YOUTUBE_CLIENT_SECRET,
    sentryDsn: env.SENTRY_DSN,
  };
}

function assertProductionGuards(config: ServiceConfig): void {
  if (config.appEnv !== "production" && config.appEnv !== "staging") return;

  const missing: string[] = [];
  if (!config.databaseUrl) missing.push("DATABASE_URL");
  if (!config.redisUrl) missing.push("REDIS_URL");
  if (!config.authSessionSecret || config.authSessionSecret.length < 32) {
    missing.push("AUTH_SESSION_SECRET");
  }
  if (!config.fieldEncryptionKey || config.fieldEncryptionKey.length < 32) {
    missing.push("FIELD_ENCRYPTION_KEY");
  }
  if (!config.objectStorageAccessKeyId) missing.push("OBJECT_STORAGE_ACCESS_KEY_ID");
  if (!config.objectStorageSecretAccessKey) missing.push("OBJECT_STORAGE_SECRET_ACCESS_KEY");
  if (config.authProvider === "local") {
    throw new ConfigError(
      "AUTH_PROVIDER=local is forbidden in staging/production (variable names only; values redacted).",
    );
  }
  if (config.aiProvider !== "fake" && !config.aiApiKey) {
    missing.push("AI_API_KEY");
  }
  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required configuration for ${config.appEnv}: ${missing.join(", ")}`,
      missing,
    );
  }
}

export function loadServiceConfig(
  serviceName: string,
  env: NodeJS.ProcessEnv = process.env,
): ServiceConfig {
  const merged = {
    ...fromEnv(env),
    serviceName: env.SERVICE_NAME ?? serviceName,
  };
  const parsed = baseSchema.merge(secretsSchema).safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.path.join(".") || "config");
    throw new ConfigError(`Invalid configuration: ${issues.join(", ")}`, issues);
  }
  assertProductionGuards(parsed.data);
  return parsed.data;
}

/** Safe subset for logs — never includes secret field values. */
export function toLogSafeConfig(config: ServiceConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (SECRET_KEYS.has(key)) {
      out[key] = value ? "[redacted]" : undefined;
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function readAppEnv(raw: string | undefined): AppEnv {
  const parsed = appEnvSchema.safeParse(raw ?? "local");
  return parsed.success ? parsed.data : "local";
}
