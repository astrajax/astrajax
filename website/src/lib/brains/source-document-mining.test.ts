import { beforeEach, describe, expect, it } from "vitest";
import { handleSourceDocumentMine } from "./handlers/source-document-mine";
import {
  clearMemorySourceDocumentsForTests,
  seedMemorySourceDocument,
} from "./handlers/source-document-memory";
import {
  SOURCE_DOCUMENT_MINE_STATUS,
  SOURCE_MINE_V1_CATEGORIES,
  buildSummarisedEligibilityFormula,
  isAllowedMineCategory,
  isEligibleForMining,
  resolveMineCategory,
  structureProposalsFromSummary,
} from "./source-document-mining";

beforeEach(() => {
  process.env.BRAIN_KEY_USE_MEMORY = "true";
  clearMemorySourceDocumentsForTests();
});

describe("source-document-mining eligibility", () => {
  it("allows only Summarised rows with non-empty summary", () => {
    expect(
      isEligibleForMining({
        mineStatus: SOURCE_DOCUMENT_MINE_STATUS.summarised,
        summary: "Ready to mine.",
      }),
    ).toBe(true);
    expect(
      isEligibleForMining({
        mineStatus: SOURCE_DOCUMENT_MINE_STATUS.pending,
        summary: "Not yet.",
      }),
    ).toBe(false);
    expect(
      isEligibleForMining({
        mineStatus: SOURCE_DOCUMENT_MINE_STATUS.proposed,
        summary: "Already mined.",
      }),
    ).toBe(false);
    expect(
      isEligibleForMining({
        mineStatus: SOURCE_DOCUMENT_MINE_STATUS.summarised,
        summary: "   ",
      }),
    ).toBe(false);
  });

  it("builds Airtable formula for Summarised + brain slug", () => {
    const formula = buildSummarisedEligibilityFormula("astrajax-chapter-1");
    expect(formula).toContain("Summarised");
    expect(formula).toContain("astrajax-chapter-1");
  });
});

describe("source-document-mining category ceiling", () => {
  it("caps v1 categories to Definition, Knowledge, Open Questions", () => {
    for (const category of SOURCE_MINE_V1_CATEGORIES) {
      expect(isAllowedMineCategory(category)).toBe(true);
    }
    expect(isAllowedMineCategory("Workflow")).toBe(false);
    expect(isAllowedMineCategory("Rules & Guardrails")).toBe(false);
  });

  it("routes uncertainty to Open Questions even when Definition is requested", () => {
    expect(resolveMineCategory("We aren't sure what this means yet?")).toBe("Open Questions");
    expect(resolveMineCategory("Sales is the outbound function.", "Definition")).toBe("Definition");
    expect(resolveMineCategory("TBD — needs a decision on pricing guardrails.")).toBe(
      "Open Questions",
    );
  });

  it("never returns categories outside the v1 ceiling from structureProposalsFromSummary", () => {
    const proposals = structureProposalsFromSummary({
      recordId: "recTest",
      documentTitle: "Ops handbook",
      summary: [
        "## Definition",
        "Direct Sales is the field channel.",
        "",
        "## Open Questions",
        "What is the Ireland handoff rule?",
      ].join("\n"),
      mineStatus: SOURCE_DOCUMENT_MINE_STATUS.summarised,
      brainSlug: "astrajax-chapter-1",
      brainTheme: "core",
    });

    expect(proposals.length).toBeGreaterThan(0);
    for (const proposal of proposals) {
      expect(isAllowedMineCategory(proposal.proposedCategory)).toBe(true);
    }
  });
});

describe("handleSourceDocumentMine (memory mode)", () => {
  it("proposes draft-shaped output and marks source rows Proposed", async () => {
    seedMemorySourceDocument({
      documentTitle: "Pricing notes",
      summary: "Claim-control caps external numbers. Open question: booth discount?",
      mineStatus: SOURCE_DOCUMENT_MINE_STATUS.summarised,
      brainSlug: "astrajax-chapter-1",
      brainTheme: "core",
    });

    seedMemorySourceDocument({
      documentTitle: "Already proposed",
      summary: "Should not re-mine.",
      mineStatus: SOURCE_DOCUMENT_MINE_STATUS.proposed,
      brainSlug: "astrajax-chapter-1",
    });

    const result = await handleSourceDocumentMine({
      brainSlug: "astrajax-chapter-1",
      limit: 5,
    });

    expect(result.eligibleCount).toBe(1);
    expect(result.draftRecordIds.length).toBeGreaterThan(0);
    expect(result.minedSourceDocumentIds.length).toBe(1);
    expect(result.proposals.some((p) => p.proposedCategory === "Open Questions")).toBe(true);

    const secondPass = await handleSourceDocumentMine({
      brainSlug: "astrajax-chapter-1",
    });
    expect(secondPass.eligibleCount).toBe(0);
  });

  it("supports dryRun without writing", async () => {
    seedMemorySourceDocument({
      documentTitle: "Dry run doc",
      summary: "Stable reference material for the booth.",
      mineStatus: SOURCE_DOCUMENT_MINE_STATUS.summarised,
      brainSlug: "astrajax-chapter-1",
    });

    const result = await handleSourceDocumentMine({
      brainSlug: "astrajax-chapter-1",
      dryRun: true,
    });

    expect(result.dryRun).toBe(true);
    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.draftRecordIds).toEqual([]);
    expect(result.minedSourceDocumentIds).toEqual([]);

    const stillEligible = await handleSourceDocumentMine({
      brainSlug: "astrajax-chapter-1",
    });
    expect(stillEligible.eligibleCount).toBe(1);
  });
});
