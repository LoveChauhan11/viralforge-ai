#!/usr/bin/env node
/**
 * Fail fast with a useful message when Node/pnpm versions are unsupported.
 * Complements package.json engines + .npmrc engine-strict.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const engines = pkg.engines ?? {};

function parseMajorMinor(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function satisfiesNode(range, current) {
  // Supports ">=X.Y.Z <A" form used in this repo.
  const gte = />=\s*(\d+\.\d+\.\d+)/.exec(range);
  const lt = /<\s*(\d+)/.exec(range);
  const cur = parseMajorMinor(current);
  if (!gte || !lt || !cur) return false;
  const min = parseMajorMinor(gte[1]);
  const maxMajor = Number(lt[1]);
  if (!min) return false;
  if (cur.major > maxMajor - 1) return false;
  if (cur.major < min.major) return false;
  if (cur.major === min.major) {
    if (cur.minor < min.minor) return false;
    if (cur.minor === min.minor && cur.patch < min.patch) return false;
  }
  return cur.major < maxMajor;
}

function satisfiesPnpm(range, current) {
  const gte = />=\s*(\d+\.\d+\.\d+)/.exec(range);
  const lt = /<\s*(\d+)/.exec(range);
  const cur = parseMajorMinor(current);
  if (!gte || !lt || !cur) return false;
  const min = parseMajorMinor(gte[1]);
  const maxMajor = Number(lt[1]);
  if (!min) return false;
  if (cur.major !== min.major) return cur.major >= min.major && cur.major < maxMajor;
  if (cur.minor < min.minor) return false;
  if (cur.minor === min.minor && cur.patch < min.patch) return false;
  return cur.major < maxMajor;
}

const nodeRange = engines.node;
const pnpmRange = engines.pnpm;
const nodeVersion = process.version;

if (nodeRange && !satisfiesNode(nodeRange, nodeVersion)) {
  console.error(
    `[viralforge] Unsupported Node.js ${nodeVersion}. Required: ${nodeRange}.\n` +
      `Use Node 22 LTS (recommended) or Node 24. See .nvmrc and ADR-011.`,
  );
  process.exit(1);
}

const userAgent = process.env.npm_config_user_agent ?? "";
const pnpmFromUa = /pnpm\/(\d+\.\d+\.\d+)/.exec(userAgent);
if (pnpmRange && pnpmFromUa && !satisfiesPnpm(pnpmRange, pnpmFromUa[1])) {
  console.error(
    `[viralforge] Unsupported pnpm ${pnpmFromUa[1]}. Required: ${pnpmRange}.\n` +
      `Enable Corepack: corepack enable && corepack prepare pnpm@9.15.9 --activate`,
  );
  process.exit(1);
}

if (pnpmRange && userAgent && !userAgent.includes("pnpm/")) {
  console.error(
    `[viralforge] This monorepo must be installed with pnpm ${pnpmRange}.\n` +
      `Run: corepack enable && corepack prepare pnpm@9.15.9 --activate\n` +
      `Or: npx pnpm@9.15.9 install`,
  );
  process.exit(1);
}
