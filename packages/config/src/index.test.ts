import { describe, expect, it } from "vitest";
import { ConfigError, loadServiceConfig, toLogSafeConfig } from "./index.js";

describe("loadServiceConfig", () => {
  it("boots local fake mode without paid credentials", () => {
    const config = loadServiceConfig("api", {
      APP_ENV: "local",
      NODE_ENV: "development",
      AI_PROVIDER: "fake",
      AUTH_PROVIDER: "local",
    });
    expect(config.serviceName).toBe("api");
    expect(config.aiProvider).toBe("fake");
    expect(config.aiApiKey).toBeUndefined();
  });

  it("fails production when required secrets are missing (names only)", () => {
    expect(() =>
      loadServiceConfig("api", {
        APP_ENV: "production",
        NODE_ENV: "production",
        AUTH_PROVIDER: "oidc",
        AI_PROVIDER: "fake",
      }),
    ).toThrow(ConfigError);

    try {
      loadServiceConfig("api", {
        APP_ENV: "production",
        NODE_ENV: "production",
        AUTH_PROVIDER: "oidc",
        AI_PROVIDER: "fake",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const message = (error as ConfigError).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).not.toMatch(/postgresql:\/\//);
    }
  });

  it("forbids local auth in production", () => {
    expect(() =>
      loadServiceConfig("api", {
        APP_ENV: "production",
        NODE_ENV: "production",
        AUTH_PROVIDER: "local",
        DATABASE_URL: "postgresql://user:super-secret@db/viralforge",
        REDIS_URL: "redis://:super-secret@redis:6379",
        AUTH_SESSION_SECRET: "x".repeat(32),
        FIELD_ENCRYPTION_KEY: "y".repeat(32),
        OBJECT_STORAGE_ACCESS_KEY_ID: "ak",
        OBJECT_STORAGE_SECRET_ACCESS_KEY: "sk",
      }),
    ).toThrow(/AUTH_PROVIDER=local is forbidden/);
  });

  it("redacts secrets in log-safe projection", () => {
    const config = loadServiceConfig("api", {
      APP_ENV: "local",
      DATABASE_URL: "postgresql://user:super-secret@localhost/db",
      AUTH_SESSION_SECRET: "z".repeat(32),
    });
    const safe = toLogSafeConfig(config);
    expect(safe.databaseUrl).toBe("[redacted]");
    expect(safe.authSessionSecret).toBe("[redacted]");
    expect(JSON.stringify(safe)).not.toContain("super-secret");
  });
});
