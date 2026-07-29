import { beforeEach, describe, expect, it } from "vitest";
import { handleInteractionAction } from "./interaction-action";
import { handleInteractionLog, clearMemoryInteractionLogsForTests } from "./interaction-log";
import { handleInteractionList } from "./interaction-list";
import { handleInteractionScore } from "./interaction-score";
import {
  isFallbackManifest,
  isFallbackRecordId,
  matchesNeedsReviewShortlist,
  resolveReviewFieldsAfterScore,
} from "../interaction-upkeep";

beforeEach(() => {
  process.env.BRAIN_KEY_USE_MEMORY = "true";
  clearMemoryInteractionLogsForTests();
});

describe("interaction-upkeep helpers", () => {
  it("detects fallback record ids", () => {
    expect(isFallbackRecordId("fallback-positioning")).toBe(true);
    expect(isFallbackRecordId("recABC123")).toBe(false);
  });

  it("detects fallback manifests", () => {
    expect(isFallbackManifest(["fallback-positioning"])).toBe(true);
    expect(isFallbackManifest(["recABC", "fallback-positioning"])).toBe(false);
  });

  it("auto-proposes on low scores", () => {
    expect(resolveReviewFieldsAfterScore(2, false)).toEqual({
      reviewStatus: "Action proposed",
      contextFlagged: "Flagged for review",
    });
    expect(resolveReviewFieldsAfterScore(4, true)).toEqual({
      reviewStatus: "Reviewed",
      contextFlagged: "Flagged for review",
    });
  });

  it("matches shortlist criteria", () => {
    expect(matchesNeedsReviewShortlist({ qualityScore: 2, reviewStatus: "Reviewed" })).toBe(true);
    expect(
      matchesNeedsReviewShortlist({ suspectedContextIssue: true, reviewStatus: "Reviewed" }),
    ).toBe(true);
    expect(matchesNeedsReviewShortlist({ qualityScore: 4, reviewStatus: "Reviewed" })).toBe(false);
    expect(matchesNeedsReviewShortlist({ qualityScore: 2, reviewStatus: "No action" })).toBe(
      false,
    );
  });
});

describe("Interaction upkeep (memory mode)", () => {
  it("lists shortlist items with low scores or context flags", async () => {
    const good = await handleInteractionLog({
      sessionId: "sess-upkeep-1",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Good answer?",
      assistantReply: "Solid reply.",
      channel: "website",
    });

    const bad = await handleInteractionLog({
      sessionId: "sess-upkeep-2",
      persona: "pam",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Bad answer?",
      assistantReply: "Weak reply.",
      channel: "website",
      manifest: {
        recordIds: ["recTrusted123"],
        hashes: ["abc"],
        grantId: "grant-1",
        retrievedAt: new Date().toISOString(),
      },
    });

    await handleInteractionScore({
      recordId: good.recordId!,
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 5,
      reviewer: "Matthew",
    });

    await handleInteractionScore({
      recordId: bad.recordId!,
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 2,
      reviewer: "Matthew",
      suspectedContextIssue: true,
    });

    const shortlist = await handleInteractionList({
      brainSlug: "astrajax-chapter-1",
      shortlist: true,
    });

    expect(shortlist.interactions).toHaveLength(1);
    expect(shortlist.interactions[0].recordId).toBe(bad.recordId);
    expect(shortlist.interactions[0].reviewStatus).toBe("Action proposed");
    expect(shortlist.interactions[0].manifestRecordIds).toEqual(["recTrusted123"]);
  });

  it("auto-proposes when scoring 1–2", async () => {
    const logged = await handleInteractionLog({
      sessionId: "sess-upkeep-3",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Pricing?",
      assistantReply: "£999",
      channel: "website",
    });

    const scored = await handleInteractionScore({
      recordId: logged.recordId!,
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 1,
      reviewer: "Client TL",
      suspectedContextIssue: true,
    });

    expect(scored.autoProposed).toBe(true);
    expect(scored.interaction.reviewStatus).toBe("Action proposed");
    expect(scored.interaction.contextFlagged).toBe("Quarantine proposed");
  });

  it("supports manual propose and dismiss actions", async () => {
    const logged = await handleInteractionLog({
      sessionId: "sess-upkeep-4",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Context?",
      assistantReply: "Maybe stale.",
      channel: "website",
    });

    await handleInteractionScore({
      recordId: logged.recordId!,
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 3,
      reviewer: "Matthew",
      suspectedContextIssue: true,
    });

    const proposed = await handleInteractionAction({
      recordId: logged.recordId!,
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      action: "propose",
    });

    expect(proposed.interaction.reviewStatus).toBe("Action proposed");
    expect(proposed.interaction.contextFlagged).toBe("Flagged for review");

    const dismissed = await handleInteractionAction({
      recordId: logged.recordId!,
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      action: "dismiss",
    });

    expect(dismissed.interaction.reviewStatus).toBe("No action");
    expect(dismissed.interaction.contextFlagged).toBe("None");
  });
});
