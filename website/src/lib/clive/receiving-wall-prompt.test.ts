import { describe, expect, it } from "vitest";
import {
  buildReceivingWallSystemPrompt,
  formatReceivingWallContext,
  getReceivingWallCliveFallbackReply,
} from "./receiving-wall-prompt";
import type { ReceivingRecord } from "@/lib/receiving-wall";

const sampleRecord: ReceivingRecord = {
  recordId: "recAmendment",
  title: "Amendment · Physician build v0.2.1 landed on remote",
  snippet: "Verified commit d496f5d, 12/12 COMPLETE",
  provenance: "Clive's Man",
  captureSource: "external",
  brainSlug: "physician",
  status: "Draft",
  canonicalText:
    "Physician build v0.2.1 landed on remote — verified commit d496f5d, 12/12 COMPLETE.",
};

describe("receiving-wall Clive prompt", () => {
  it("includes canonical text and metadata in context block", () => {
    const formatted = formatReceivingWallContext({
      focusedRecord: sampleRecord,
      records: [sampleRecord],
    });
    expect(formatted).toContain(sampleRecord.title);
    expect(formatted).toContain(sampleRecord.canonicalText!);
    expect(formatted).toContain("proposedBrainSlug: physician");
    expect(formatted).toContain("Architect has");
  });

  it("uses curation guardrails and never website sales language in system prompt", () => {
    const system = buildReceivingWallSystemPrompt({
      focusedRecord: sampleRecord,
      records: [sampleRecord],
    });
    expect(system).toContain("Receiving Wall");
    expect(system).toContain("Never pitch services");
    expect(system).toContain("internal curation");
  });

  it("fallback reply references the open record when asked what it is", () => {
    const reply = getReceivingWallCliveFallbackReply("Tell me what it is", {
      focusedRecord: sampleRecord,
      records: [sampleRecord],
    });
    expect(reply).toContain(sampleRecord.title);
    expect(reply).toContain("d496f5d");
    expect(reply).not.toContain("Adoption OS Audit");
  });
});
