#!/usr/bin/env node
/**
 * Lightweight contract gate: contracts package must build and export dist.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const result = spawnSync("npx", ["pnpm@9.15.9", "--filter", "@viralforge/contracts", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const dts = join(root, "packages", "contracts", "dist", "index.d.ts");
const js = join(root, "packages", "contracts", "dist", "index.js");
if (!existsSync(dts) || !existsSync(js)) {
  console.error("Contract drift/build failure: packages/contracts/dist missing outputs");
  process.exit(1);
}

console.log("Contract build check passed.");
