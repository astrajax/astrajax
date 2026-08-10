import { describe, expect, it } from "vitest";
import { toChunks } from "./chunks";
import type { ContextIndexSource } from "./sources";

const source: ContextIndexSource = {
  clientId: "astrajax-chapter-1",
  baseId: "appTest",
  tableId: "tblTest",
  labelField: "Title",
  fields: ["Title", "Canonical Text", "Category"],
  approvedField: "Last Reviewed",
  tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
};

describe("toChunks", () => {
  it("makes one chunk per non-empty field and prefixes non-label fields", () => {
    const chunks = toChunks(source, {
      id: "rec1",
      createdTime: "2026-08-01T12:00:00.000Z",
      fields: {
        Title: "Pricing guardrail",
        "Canonical Text": "Humans approve discounts.",
        Category: "governance",
        "Last Reviewed": "2026-08-02T09:00:00.000Z",
      },
    });

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toMatchObject({
      fieldPath: "Title",
      content: "Pricing guardrail",
    });
    expect(chunks[1]).toMatchObject({
      fieldPath: "Canonical Text",
      content: "Pricing guardrail — Canonical Text: Humans approve discounts.",
      approvedAt: "2026-08-02T09:00:00.000Z",
    });
  });

  it("skips empty fields", () => {
    const chunks = toChunks(source, {
      id: "rec2",
      createdTime: "2026-08-01T12:00:00.000Z",
      fields: {
        Title: "Only title",
        "Canonical Text": "   ",
      },
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].fieldPath).toBe("Title");
  });
});
