#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const composeFile = join(root, "infra", "local", "docker-compose.yml");
const action = process.argv[2] ?? "up";

function run(args) {
  const result = spawnSync("docker", ["compose", "-f", composeFile, ...args], {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (action === "up") {
  // Wait only on long-running deps. minio-init is a one-shot and breaks `compose --wait`.
  run(["up", "-d", "--wait", "postgres", "redis", "minio"]);
  run(["up", "--no-deps", "minio-init"]);
  console.log("[infra] PostgreSQL, Redis, and MinIO are healthy.");
  process.exit(0);
}

if (action === "down") {
  run(["down"]);
  console.log("[infra] Stopped. Volumes retained.");
  process.exit(0);
}

if (action === "reset") {
  const rl = createInterface({ input, output });
  const answer = await rl.question(
    "This DELETES local Postgres/Redis/MinIO volumes. Type RESET to continue: ",
  );
  rl.close();
  if (answer.trim() !== "RESET") {
    console.error("[infra] Aborted. No volumes removed.");
    process.exit(1);
  }
  run(["down", "-v"]);
  console.log("[infra] Stopped and volumes removed.");
  process.exit(0);
}

console.error(`Unknown action: ${action}. Use up | down | reset.`);
process.exit(1);
