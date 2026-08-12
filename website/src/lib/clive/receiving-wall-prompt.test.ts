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
  category: "Governance",
  systemBrainName: "The Physician",
  systemBrainSlug: "physician",
  brainSlug: "physician-legacy",
  status: "Draft",
  canonicalText:
    "Physician build v0.2.1 landed on remote — verified commit d496f5d, 12/12 COMPLETE.",
};

describe("receiving-wall Clive prompt", () => {
  it("includes canonical text and metadata in context block", () => {
    const formatted = formatReceivingWallContext({
      focusedRecord: sampleRecord,
      records: [sampleRecord],
      bayCategory: "Governance",
    });
    expect(formatted).toContain(sampleRecord.title);
    expect(formatted).toContain(sampleRecord.canonicalText!);
    expect(formatted).toContain("systemBrainName: The Physician");
    expect(formatted).toContain("systemBrainSlug: physician");
    expect(formatted).toContain("proposedBrainSlug: physician");
    expect(formatted).not.toContain("proposedBrainSlug: physician-legacy");
    expect(formatted).toContain("proposedCategory: Governance");
    expect(formatted).toContain("Bay: Governance");
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
    expect(reply).toContain("I'd route it toward physician");
    expect(reply).not.toContain("physician-legacy");
    expect(reply).not.toContain("Adoption OS Audit");
  });
});
