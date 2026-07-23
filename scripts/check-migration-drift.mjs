#!/usr/bin/env node
/**
 * Fail if drizzle-kit generate would change committed migration files.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, cpSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

const root = process.cwd();
const drizzleDir = join(root, "packages", "database", "drizzle");

if (!existsSync(drizzleDir)) {
  console.error("Missing packages/database/drizzle");
  process.exit(1);
}

function hashTree(dir) {
  const hash = createHash("sha256");
  const walk = (d) => {
    for (const name of readdirSync(d, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const p = join(d, name.name);
      if (name.isDirectory()) walk(p);
      else {
        hash.update(p.replace(/\\/g, "/"));
        hash.update(readFileSync(p));
      }
    }
  };
  walk(dir);
  return hash.digest("hex");
}

const before = hashTree(drizzleDir);
const staging = mkdtempSync(join(tmpdir(), "vf-drizzle-"));
const stagedDrizzle = join(staging, "drizzle");
cpSync(drizzleDir, stagedDrizzle, { recursive: true });

const result = spawnSync(
  "npx",
  [
    "pnpm@9.15.9",
    "--filter",
    "@viralforge/database",
    "exec",
    "drizzle-kit",
    "generate",
    "--name",
    "ci_drift_check",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge",
    },
    encoding: "utf8",
    shell: process.platform === "win32",
  },
);

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  rmSync(staging, { recursive: true, force: true });
  process.exit(result.status ?? 1);
}

const after = hashTree(drizzleDir);
if (before !== after) {
  console.error(
    "Migration drift detected: schema changes require a committed drizzle-kit generate.\n" +
      "Run: pnpm --filter @viralforge/database generate\n" +
      "Then commit packages/database/drizzle changes.",
  );
  // Restore committed tree from staging snapshot
  rmSync(drizzleDir, { recursive: true, force: true });
  cpSync(stagedDrizzle, drizzleDir, { recursive: true });
  rmSync(staging, { recursive: true, force: true });
  process.exit(1);
}

rmSync(staging, { recursive: true, force: true });
console.log("Migration drift check passed (drizzle tree unchanged).");
