import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/brains/handlers/draft-truth-list", () => ({
  handleDraftTruthList: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/interaction-list", () => ({
  handleInteractionList: vi.fn(),
}));

vi.mock("@/lib/brains/trusted-truth", () => ({
  retrieveTrustedSnippets: vi.fn(),
}));

import { handleDraftTruthList } from "@/lib/brains/handlers/draft-truth-list";
import { handleInteractionList } from "@/lib/brains/handlers/interaction-list";
import { retrieveTrustedSnippets } from "@/lib/brains/trusted-truth";
import { handleBrainHealthLive } from "./brain-health-live";

const draftMock = vi.mocked(handleDraftTruthList);
const interactionMock = vi.mocked(handleInteractionList);
const trustedMock = vi.mocked(retrieveTrustedSnippets);

describe("handleBrainHealthLive", () => {
  beforeEach(() => {
    draftMock.mockReset();
    interactionMock.mockReset();
    trustedMock.mockReset();
    draftMock.mockResolvedValue({
      mode: "fallback",
      drafts: [],
      message: "unwired",
    } as never);
    interactionMock.mockResolvedValue({ interactions: [] } as never);
    trustedMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("defaults blank slugs to Chapter 1 and reports fallback when nothing is live", async () => {
    const result = await handleBrainHealthLive("   ");

    expect(draftMock).toHaveBeenCalledWith("astrajax-chapter-1");
    expect(interactionMock).toHaveBeenCalledWith({
      brainSlug: "astrajax-chapter-1",
      limit: 20,
    });
    expect(result.source).toBe("fallback");
    expect(result.snapshot.brainSlug).toBe("astrajax-chapter-1");
    expect(result.snapshot.brainName).toBe("AstraJax Chapter 1");
    expect(result.snapshot.currentLevel).toBe("seedling");
    expect(result.message).toMatch(/fallback counts/i);
  });

  it("counts flagged interactions and drafts into live metrics", async () => {
    draftMock.mockResolvedValue({
      mode: "airtable",
      drafts: [
        {
          recordId: "recDraft",
          title: "Draft claim",
          canonicalText: "A".repeat(300),
          status: "Draft",
          proposedCategory: "Positioning",
        },
      ],
    } as never);
    interactionMock.mockResolvedValue({
      interactions: [
        {
          recordId: "recIx1",
          reviewStatus: "Action proposed",
          qualityScore: 5,
        },
        {
          recordId: "recIx2",
          contextFlagged: "Flagged for review",
          qualityScore: 4,
        },
        {
          recordId: "recIx3",
          qualityScore: 1,
        },
        {
          recordId: "recIx4",
          qualityScore: 5,
        },
      ],
    } as never);
    trustedMock.mockImplementation(async ({ scope }) => {
      if (scope.includes("positioning")) {
        return [
          {
            recordId: "recTrusted1",
            title: "Positioning",
            text: "Trusted positioning claim",
            contentHash: "h1",
          },
        ];
      }
      return [
        {
          recordId: "fallback-gov",
          title: "Fallback",
          text: "ignored",
          contentHash: "h0",
        },
      ];
    });

    const result = await handleBrainHealthLive("butternut-direct-sales");

    expect(result.source).toBe("live");
    expect(result.snapshot.brainName).toBe("Butternut Direct Sales");
    expect(result.snapshot.metrics.approvedRecordCount).toBe(1);
    expect(result.snapshot.metrics.draftRecordCount).toBe(1);
    expect(result.snapshot.metrics.knownGaps).toEqual(["1 draft row(s) awaiting review"]);
    // 1 of 4 interactions scored ≤2 → 25%
    expect(result.snapshot.metrics.answerFailureRate).toBe(25);
    expect(result.snapshot.currentLevel).toBe("seedling");
    expect(result.snapshot.truths).toHaveLength(2);
    expect(result.snapshot.truths[0]?.summary.length).toBeLessThanOrEqual(240);
    expect(result.snapshot.truths[1]?.summary).toHaveLength(240);
  });
});
