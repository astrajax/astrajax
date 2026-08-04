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

  it("accepts a wall-Approved draft for the matching brain", () => {
    expect(
      assertDraftEligibleForPromote({
        draftRecordId: "recDraft1",
        brainSlug: "astrajax-chapter-1",
        fields: {
          Title: "Wall-accepted line",
          "Canonical Text": "Human confirmed on the Receiving Wall.",
          "Brain Slug": "astrajax-chapter-1",
          Status: "Approved",
        },
      }),
    ).toEqual({
      title: "Wall-accepted line",
      canonicalText: "Human confirmed on the Receiving Wall.",
    });
  });

  it("accepts a custom Receiving Wall accept status when configured", () => {
    process.env.BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS = "Ready for Doc";
    try {
      expect(
        assertDraftEligibleForPromote({
          draftRecordId: "recDraft1",
          brainSlug: "astrajax-chapter-1",
          fields: {
            Title: "Custom accept status",
            "Canonical Text": "Accepted under a custom status label.",
            "Brain Slug": "astrajax-chapter-1",
            Status: "Ready for Doc",
          },
        }),
      ).toEqual({
        title: "Custom accept status",
        canonicalText: "Accepted under a custom status label.",
      });
    } finally {
      delete process.env.BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS;
    }
  });

  it("rejects cross-brain and terminal-status rows", () => {
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
    ).toThrow(/not eligible to promote/);
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
    ).rejects.toThrow(/not eligible to promote/);
  });
});
