import { describe, expect, it } from "vitest";
import { normalizePageLimit, problem } from "./index.js";

describe("problem", () => {
  it("omits undefined optional fields", () => {
    const body = problem(400, "Bad Request", { detail: "nope", requestId: "r1" });
    expect(body.status).toBe(400);
    expect(body.requestId).toBe("r1");
    expect("instance" in body).toBe(false);
  });
});

describe("normalizePageLimit", () => {
  it("clamps and defaults", () => {
    expect(normalizePageLimit(undefined)).toBe(20);
    expect(normalizePageLimit("5")).toBe(5);
    expect(normalizePageLimit(999)).toBe(100);
  });
});
