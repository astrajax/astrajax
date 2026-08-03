import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assertDraftEligibleForPromote,
  clearMemoryDraftProposalsForTests,
  createDraftTruth,
  getMemoryDraftsForTests,
  promoteDraftToTrustedDemo,
} from "./draft-propose";

describe("assertDraftEligibleForPromote", () => {
  it("accepts a Draft that belongs to the requested brain", () => {
    expect(
      assertDraftEligibleForPromote({
        draftRecordId: "recDraft1",
        brainSlug: "astrajax-chapter-1",
        fields: {
          Title: "Positioning line",
          "Canonical Text": "Approved wording.",
          "Brain Slug": "astrajax-chapter-1",
          Status: "Draft",
        },
      }),
    ).toEqual({
      title: "Positioning line",
      canonicalText: "Approved wording.",
    });
  });

  it("rejects cross-brain and non-Draft rows", () => {
    expect(() =>
      assertDraftEligibleForPromote({
        draftRecordId: "recDraft1",
        brainSlug: "astrajax-chapter-1",
        fields: {
          Title: "Brand line",
          "Canonical Text": "Other brain.",
          "Brain Slug": "astrajax-brand",
          Status: "Draft",
        },
      }),
    ).toThrow(/Brain does not match/);

    expect(() =>
      assertDraftEligibleForPromote({
        draftRecordId: "recDraft1",
        brainSlug: "astrajax-chapter-1",
        fields: {
          Title: "Already promoted",
          "Canonical Text": "Should not re-enter Trusted.",
          "Brain Slug": "astrajax-chapter-1",
          Status: "Quarantined",
        },
      }),
    ).toThrow(/not in Draft status/);
  });
});

describe("promoteDraftToTrustedDemo memory path", () => {
  beforeEach(() => {
    clearMemoryDraftProposalsForTests();
    process.env.BRAIN_KEY_USE_MEMORY = "true";
  });

  afterEach(() => {
    clearMemoryDraftProposalsForTests();
    delete process.env.BRAIN_KEY_USE_MEMORY;
  });

  it("refuses unknown drafts and marks promoted memory drafts Quarantined", async () => {
    await expect(
      promoteDraftToTrustedDemo({
        brainSlug: "astrajax-chapter-1",
        draftRecordId: "missing",
        category: "Positioning",
        scope: "read:brain-truth:positioning",
      }),
    ).rejects.toThrow(/Draft record not found/);

    const created = await createDraftTruth({
      brainSlug: "astrajax-chapter-1",
      title: "Demo draft",
      canonicalText: "Canonical body for the demo draft.",
      proposedCategory: "Positioning",
    });

    const first = await promoteDraftToTrustedDemo({
      brainSlug: "astrajax-chapter-1",
      draftRecordId: created.recordId,
      category: "Positioning",
      scope: "read:brain-truth:positioning",
    });
    expect(first.mode).toBe("memory");
    expect(getMemoryDraftsForTests()[0]?.status).toBe("Quarantined");

    await expect(
      promoteDraftToTrustedDemo({
        brainSlug: "astrajax-chapter-1",
        draftRecordId: created.recordId,
        category: "Positioning",
        scope: "read:brain-truth:positioning",
      }),
    ).rejects.toThrow(/not in Draft status/);
  });
});
