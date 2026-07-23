#!/usr/bin/env node
/**
 * Build all Sprint 0 Docker image targets for local evidence.
 * Usage: node ./scripts/docker-build.mjs [target...]
 */
import { spawnSync } from "node:child_process";

const ALL = ["api", "web", "worker-general", "worker-media", "worker-ai", "scheduler", "migrate"];

const targets = process.argv.slice(2);
const selected = targets.length > 0 ? targets : ALL;

for (const target of selected) {
  if (!ALL.includes(target)) {
    console.error(`Unknown target: ${target}. Expected one of: ${ALL.join(", ")}`);
    process.exit(1);
  }
  const tag = `viralforge-${target}:local`;
  console.log(`\n=== docker build --target ${target} -t ${tag} ===\n`);
  const result = spawnSync("docker", ["build", "--target", target, "-t", tag, "."], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll selected targets built.");
