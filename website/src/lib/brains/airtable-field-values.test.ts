import { describe, expect, it } from "vitest";
import { normalizeCreatedBy } from "./airtable-field-values";

describe("normalizeCreatedBy", () => {
  it("passes through valid Airtable values", () => {
    expect(normalizeCreatedBy("Matthew")).toBe("Matthew");
    expect(normalizeCreatedBy("Agent")).toBe("Agent");
    expect(normalizeCreatedBy("Website")).toBe("Website");
    expect(normalizeCreatedBy("TL")).toBe("TL");
  });

  it("maps Architect to Matthew and demo seed to Website", () => {
    expect(normalizeCreatedBy("Architect")).toBe("Matthew");
    expect(normalizeCreatedBy("Demo seed")).toBe("Website");
  });

  it("maps agent names to Agent", () => {
    expect(normalizeCreatedBy("Clive's Man")).toBe("Agent");
  });
});
