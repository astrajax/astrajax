import { describe, expect, it } from "vitest";
import { toVectorLiteral } from "./db";

describe("toVectorLiteral", () => {
  it("formats a pgvector literal without spaces", () => {
    expect(toVectorLiteral([0.1, -0.25, 3])).toBe("[0.1,-0.25,3]");
  });

  it("formats an empty vector", () => {
    expect(toVectorLiteral([])).toBe("[]");
  });
});
