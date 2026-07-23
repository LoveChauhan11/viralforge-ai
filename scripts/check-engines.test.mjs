// Engine check unit coverage (Node script; no TypeScript transpile needed).
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const script = join(root, "scripts", "check-engines.mjs");

function envWithUserAgent(userAgent) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === "npm_config_user_agent") {
      delete env[key];
    }
  }
  env.npm_config_user_agent = userAgent;
  return env;
}

describe("check-engines", () => {
  it("passes on the current supported Node runtime when invoked as pnpm", () => {
    const result = spawnSync(process.execPath, [script], {
      env: envWithUserAgent("pnpm/9.15.9 npm/? node/v22.14.0 darwin x64"),
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
  });

  it("fails when install is attempted with npm instead of pnpm", () => {
    const result = spawnSync(process.execPath, [script], {
      env: envWithUserAgent("npm/10.0.0 node/v22.14.0 darwin x64"),
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("must be installed with pnpm");
  });
});
