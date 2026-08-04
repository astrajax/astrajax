import { describe, expect, it } from "vitest";
import { handleReceivingWallClive } from "./receiving-wall-clive";

const sampleRecord = {
  recordId: "recTest001",
  title: "Amendment · Physician build v0.2.1 landed on remote",
  snippet: "Verified commit d496f5d",
  provenance: "Clive's Man",
  captureSource: "external" as const,
  brainSlug: "physician",
  status: "Draft",
  canonicalText:
    "Physician build v0.2.1 landed on remote — verified commit d496f5d, 12/12 COMPLETE.",
};

describe("handleReceivingWallClive", () => {
  it("returns 200-style curation fallback without an API key", async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await handleReceivingWallClive({
      sessionId: "rw_test",
      message: "Tell me what it is",
      history: [],
      focusedRecord: sampleRecord,
      records: [sampleRecord],
    });

    expect(result.reply).toContain("Physician build v0.2.1");
    expect(result.reply).toContain("d496f5d");
    expect(result.reply).not.toContain("Adoption OS Audit");
    expect(result.fallback).toBe(true);

    if (previous) process.env.ANTHROPIC_API_KEY = previous;
  });
});
