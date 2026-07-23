import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".turbo") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (entry === "package.json") acc.push(full);
  }
  return acc;
}

function readPkg(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const FORBIDDEN_IN_DOMAIN = [
  "next",
  "fastify",
  "react",
  "bullmq",
  "@aws-sdk",
  "@viralforge/providers",
  "@viralforge/ui",
  "@viralforge/service-kit",
  "@viralforge/web",
  "@viralforge/api",
];

const FORBIDDEN_IN_WORKERS = ["@viralforge/ui", "@viralforge/web", "next", "react"];

describe("package dependency direction", () => {
  const packages = walk(root)
    .map((path) => ({ path, pkg: readPkg(path), rel: relative(root, path).replace(/\\/g, "/") }))
    .filter((p) => p.pkg.name?.startsWith("@viralforge/"));

  it("domain does not depend on frameworks or provider/UI packages", () => {
    const domain = packages.find((p) => p.pkg.name === "@viralforge/domain");
    expect(domain).toBeTruthy();
    const deps = {
      ...domain.pkg.dependencies,
      ...domain.pkg.devDependencies,
    };
    for (const forbidden of FORBIDDEN_IN_DOMAIN) {
      const hit = Object.keys(deps).find(
        (name) => name === forbidden || name.startsWith(`${forbidden}/`),
      );
      expect(hit, `domain must not depend on ${forbidden}`).toBeUndefined();
    }
  });

  it("workers do not depend on web/UI packages", () => {
    const workerPkgs = packages.filter(
      (p) =>
        p.pkg.name?.startsWith("@viralforge/worker-") || p.rel.startsWith("workers/"),
    );
    expect(workerPkgs.length).toBeGreaterThan(0);
    for (const worker of workerPkgs) {
      const deps = {
        ...worker.pkg.dependencies,
        ...worker.pkg.devDependencies,
      };
      for (const forbidden of FORBIDDEN_IN_WORKERS) {
        expect(
          deps[forbidden],
          `${worker.pkg.name} must not depend on ${forbidden}`,
        ).toBeUndefined();
      }
    }
  });

  it("required deployable packages exist", () => {
    const names = new Set(packages.map((p) => p.pkg.name));
    for (const required of [
      "@viralforge/web",
      "@viralforge/api",
      "@viralforge/scheduler",
      "@viralforge/worker-general",
      "@viralforge/worker-media",
      "@viralforge/worker-ai",
      "@viralforge/domain",
      "@viralforge/contracts",
      "@viralforge/config",
      "@viralforge/database",
      "@viralforge/observability",
      "@viralforge/queue",
      "@viralforge/storage",
      "@viralforge/providers",
      "@viralforge/ui",
    ]) {
      expect(names.has(required), `missing ${required}`).toBe(true);
    }
  });
});
