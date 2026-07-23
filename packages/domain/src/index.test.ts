import { describe, expect, it } from "vitest";
import { isNonEmptyString } from "./index.js";

describe("isNonEmptyString", () => {
  it("accepts trimmed non-empty strings", () => {
    expect(isNonEmptyString("ok")).toBe(true);
  });

  it("rejects blank and non-strings", () => {
    expect(isNonEmptyString("  ")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});
