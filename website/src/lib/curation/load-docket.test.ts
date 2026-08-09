import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/brains/handlers/draft-truth-list", () => ({
  handleDraftTruthList: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/interaction-list", () => ({
  handleInteractionList: vi.fn(),
}));

vi.mock("@/lib/brains/trusted-truth", () => ({
  retrieveTrustedSnippets: vi.fn(),
  FALLBACK_TRUSTED_SNIPPETS: [
    {
      recordId: "fallback-positioning",
      title: "Fallback",
      text: "Fallback trusted text",
    },
  ],
}));

vi.mock("@/lib/brains/airtable-rest", () => ({
  airtableSelect: vi.fn(),
}));

vi.mock("@/lib/brains/config", () => ({
  getWorkshopBaseId: vi.fn(() => undefined),
  getWorkshopReadToken: vi.fn(() => undefined),
  getWorkshopWriteToken: vi.fn(() => undefined),
}));

import { handleDraftTruthList } from "@/lib/brains/handlers/draft-truth-list";
import { handleInteractionList } from "@/lib/brains/handlers/interaction-list";
import { retrieveTrustedSnippets } from "@/lib/brains/trusted-truth";
import { loadCurationDocket } from "./knowledge";

const draftListMock = vi.mocked(handleDraftTruthList);
const interactionListMock = vi.mocked(handleInteractionList);
const trustedMock = vi.mocked(retrieveTrustedSnippets);

beforeEach(() => {
  draftListMock.mockReset();
  interactionListMock.mockReset();
  trustedMock.mockReset();
});

describe("loadCurationDocket", () => {
  it("defaults blank brain slugs and maps drafts/interactions into the docket", async () => {
    draftListMock.mockResolvedValue({
      mode: "memory",
      drafts: [
        {
          recordId: "recDraft1",
          title: "Draft claim",
          canonicalText: "body",
          status: "Draft",
          proposedCategory: "Positioning",
        },
      ],
    } as never);
    interactionListMock.mockResolvedValue({
      interactions: [
        {
          recordId: "recIx1",
          source: "brain_interactions",
          stableId: "brain_interactions:recIx1",
          userMessage: "Need a review?",
          assistantReply: "Yes.",
          reviewStatus: "Flagged",
          contextFlagged: "Flagged for review",
          qualityScore: 2,
        },
      ],
    } as never);
    trustedMock.mockResolvedValue([]);

    const docket = await loadCurationDocket("   ");

    expect(docket.brainSlug).toBe("astrajax-chapter-1");
    expect(docket.mode).toBe("memory");
    expect(docket.drafts).toEqual([
      {
        recordId: "recDraft1",
        title: "Draft claim",
        canonicalText: "body",
        status: "Draft",
        proposedCategory: "Positioning",
      },
    ]);
    expect(docket.flaggedInteractions).toHaveLength(1);
    expect(docket.flaggedInteractions[0]?.recordId).toBe("recIx1");
    expect(docket.trustedTruths[0]?.recordId).toBe("fallback-positioning");
    expect(draftListMock).toHaveBeenCalledWith("astrajax-chapter-1");
  });

  it("keeps the docket usable when interaction listing fails", async () => {
    draftListMock.mockResolvedValue({
      mode: "airtable",
      drafts: [],
    } as never);
    interactionListMock.mockRejectedValue(new Error("Airtable down"));
    trustedMock.mockResolvedValue([
      {
        recordId: "recTruth1",
        title: "Live truth",
        text: "Canonical body",
      },
    ]);

    const docket = await loadCurationDocket("astrajax-chapter-1");

    expect(docket.mode).toBe("airtable");
    expect(docket.flaggedInteractions).toEqual([]);
    expect(docket.trustedTruths).toEqual([
      {
        recordId: "recTruth1",
        title: "Live truth",
        canonicalText: "Canonical body",
        scope: "read:brain-truth:positioning",
      },
      {
        recordId: "recTruth1",
        title: "Live truth",
        canonicalText: "Canonical body",
        scope: "read:brain-truth:governance",
      },
    ]);
  });
});
