import { describe, expect, it } from "vitest";
import { formatDocketForPrompt } from "./knowledge";
import type { CurationDocket } from "./types";

function emptyDocket(overrides: Partial<CurationDocket> = {}): CurationDocket {
  return {
    brainSlug: "astrajax-chapter-1",
    mode: "memory",
    drafts: [],
    flaggedInteractions: [],
    pendingSourceDocuments: [],
    trustedTruths: [],
    ...overrides,
  };
}

describe("formatDocketForPrompt", () => {
  it("renders empty-section placeholders so Clive can summarise gaps", () => {
    const prompt = formatDocketForPrompt(emptyDocket());

    expect(prompt).toContain("Brain: astrajax-chapter-1");
    expect(prompt).toContain("TRUSTED TRUTHS (0):");
    expect(prompt).toContain("- None loaded yet.");
    expect(prompt).toContain("DRAFT TRUTHS (0):");
    expect(prompt).toContain("- None pending.");
    expect(prompt).toContain("FLAGGED INTERACTIONS (0):");
    expect(prompt).toContain("- None flagged.");
    expect(prompt).toContain("SOURCE DOCUMENTS (0):");
    expect(prompt).toContain("- None awaiting mining.");
  });

  it("includes ids, statuses, and truncates long trusted/user text for the prompt budget", () => {
    const longTruth = "T".repeat(250);
    const longMessage = "M".repeat(180);
    const prompt = formatDocketForPrompt(
      emptyDocket({
        trustedTruths: [
          {
            recordId: "recTruth1",
            title: "Positioning",
            canonicalText: longTruth,
            scope: "read:brain-truth:positioning",
          },
        ],
        drafts: [
          {
            recordId: "recDraft1",
            title: "Draft claim",
            canonicalText: "body",
            status: "Draft",
          },
        ],
        flaggedInteractions: [
          {
            recordId: "recIx1",
            source: "household_activity",
            stableId: "household_activity:recIx1",
            userMessage: longMessage,
            assistantReply: "reply",
            qualityScore: 2,
            contextFlagged: "Flagged for review",
          },
        ],
        pendingSourceDocuments: [
          {
            recordId: "recSrc1",
            title: "Ops notes",
            mineStatus: "Pending",
          },
        ],
      }),
    );

    expect(prompt).toContain("TRUSTED TRUTHS (1):");
    expect(prompt).toContain("- [recTruth1] Positioning:");
    expect(prompt).toContain("T".repeat(200));
    expect(prompt).not.toContain("T".repeat(201));

    expect(prompt).toContain("- [recDraft1] Draft claim (Draft)");
    expect(prompt).toContain(
      "- [household_activity:recIx1] score=2 flagged=Flagged for review:",
    );
    expect(prompt).toContain("M".repeat(120));
    expect(prompt).not.toContain("M".repeat(121));

    expect(prompt).toContain("- [recSrc1] Ops notes (Pending)");
  });

  it("caps trusted truths at 12 rows so a large docket cannot blow the system prompt", () => {
    const trustedTruths = Array.from({ length: 15 }, (_, index) => ({
      recordId: `recT${index}`,
      title: `Truth ${index}`,
      canonicalText: `Body ${index}`,
    }));
    const prompt = formatDocketForPrompt(emptyDocket({ trustedTruths }));

    expect(prompt).toContain("TRUSTED TRUTHS (15):");
    expect(prompt).toContain("[recT0]");
    expect(prompt).toContain("[recT11]");
    expect(prompt).not.toContain("[recT12]");
  });

  it("uses ? for missing quality scores and None when contextFlagged is absent", () => {
    const prompt = formatDocketForPrompt(
      emptyDocket({
        flaggedInteractions: [
          {
            recordId: "recIxBare",
            source: "brain_interactions",
            stableId: "brain_interactions:recIxBare",
            userMessage: "short",
            assistantReply: "ok",
          },
        ],
      }),
    );

    expect(prompt).toContain(
      "- [brain_interactions:recIxBare] score=? flagged=None: short",
    );
  });
});
