import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeCurationProposal } from "./curation-confirm";
import {
  clearMemoryDraftProposalsForTests,
  createDraftTruth,
} from "./draft-propose";
import {
  clearMemoryInteractionLogsForTests,
  handleInteractionLog,
} from "./interaction-log";
import type { CurationProposal } from "@/lib/curation/types";

function baseProposal(overrides: Partial<CurationProposal>): CurationProposal {
  return {
    id: "prop_test",
    toolName: "propose_draft_truth",
    title: "Test proposal",
    summary: "summary",
    destination: "workshop-draft-truth",
    brainSlug: "astrajax-chapter-1",
    payload: {},
    status: "pending",
    ...overrides,
  };
}

describe("executeCurationProposal", () => {
  beforeEach(() => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    clearMemoryDraftProposalsForTests();
    clearMemoryInteractionLogsForTests();
  });

  afterEach(() => {
    clearMemoryDraftProposalsForTests();
    clearMemoryInteractionLogsForTests();
    delete process.env.BRAIN_KEY_USE_MEMORY;
  });

  it("fails interaction proposals that omit a valid source", async () => {
    const result = await executeCurationProposal({
      proposal: baseProposal({
        toolName: "propose_quarantine",
        destination: "workshop-interactions",
        payload: {
          recordId: "recMissingSource",
          recordType: "interaction",
          reason: "off brief",
        },
      }),
    });

    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/missing its source/);
  });

  it("files mark_no_action against a logged Workshop interaction", async () => {
    const logged = await handleInteractionLog({
      sessionId: "sess-curation-confirm",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Can we close this?",
      assistantReply: "Yes — no action needed.",
      channel: "website",
    });

    const result = await executeCurationProposal({
      proposal: baseProposal({
        toolName: "mark_no_action",
        destination: "workshop-interactions",
        payload: {
          recordId: logged.recordId,
          source: "brain_interactions",
          reason: "Already answered in Trusted Brain",
        },
      }),
      actor: "Matthew",
    });

    expect(result.status).toBe("confirmed");
    expect(result.recordId).toBe(logged.recordId);
  });

  it("creates a Workshop draft from propose_draft_truth", async () => {
    const result = await executeCurationProposal({
      proposal: baseProposal({
        payload: {
          title: "Adoption principle",
          canonicalText: "Personality is adoption infrastructure.",
          proposedCategory: "Knowledge",
        },
      }),
      actor: "Matthew",
    });

    expect(result.status).toBe("confirmed");
    expect(result.recordId).toMatch(/^mem_draft_/);
  });

  it("surfaces promote failures instead of confirming a bad draft id", async () => {
    const created = await createDraftTruth({
      brainSlug: "astrajax-chapter-1",
      title: "Keep Draft",
      canonicalText: "Still a draft.",
      proposedCategory: "Knowledge",
    });

    const result = await executeCurationProposal({
      proposal: baseProposal({
        toolName: "promote_to_trusted",
        destination: "trusted-brain-truth",
        brainSlug: "some-other-brain",
        payload: {
          draftRecordId: created.recordId,
          category: "Knowledge",
          scope: "read:brain-truth:governance",
        },
      }),
    });

    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/Brain does not match/);
  });
});
