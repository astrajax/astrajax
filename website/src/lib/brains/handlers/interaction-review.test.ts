import { beforeEach, describe, expect, it } from "vitest";
import { handleInteractionLog, clearMemoryInteractionLogsForTests } from "./interaction-log";
import { handleInteractionList } from "./interaction-list";
import { handleInteractionScore } from "./interaction-score";

beforeEach(() => {
  process.env.BRAIN_KEY_USE_MEMORY = "true";
  clearMemoryInteractionLogsForTests();
});

describe("Interaction review (memory mode)", () => {
  it("lists and scores logged interactions for a brain", async () => {
    const logged = await handleInteractionLog({
      sessionId: "sess-review-1",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "What is our positioning?",
      assistantReply: "AstraJax helps commercial teams turn domain expertise into AI-ready operating systems.",
      channel: "website",
    });

    expect(logged.recordId).toBeTruthy();

    const listed = await handleInteractionList({ brainSlug: "astrajax-chapter-1" });
    expect(listed.interactions).toHaveLength(1);
    expect(listed.interactions[0].userMessage).toContain("positioning");

    const scored = await handleInteractionScore({
      recordId: logged.recordId!,
      brainSlug: "astrajax-chapter-1",
      qualityScore: 4,
      reviewer: "Matthew",
      reviewNotes: "Solid answer",
      suspectedContextIssue: false,
    });

    expect(scored.interaction.qualityScore).toBe(4);
    expect(scored.interaction.reviewStatus).toBe("Reviewed");
    expect(scored.interaction.contextFlagged).toBe("None");
  });

  it("rejects invalid quality scores", async () => {
    const logged = await handleInteractionLog({
      sessionId: "sess-review-2",
      persona: "pam",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Challenge this claim",
      assistantReply: "Weakest assumption: pricing is fixed.",
      channel: "website",
    });

    await expect(
      handleInteractionScore({
        recordId: logged.recordId!,
        brainSlug: "astrajax-chapter-1",
        qualityScore: 6,
        reviewer: "Matthew",
      }),
    ).rejects.toThrow(/1 to 5/);
  });

  it("flags context when suspected issue is checked", async () => {
    const logged = await handleInteractionLog({
      sessionId: "sess-review-3",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "What did we say about pricing?",
      assistantReply: "Pricing starts at £999.",
      channel: "website",
    });

    const scored = await handleInteractionScore({
      recordId: logged.recordId!,
      brainSlug: "astrajax-chapter-1",
      qualityScore: 2,
      reviewer: "Client TL",
      suspectedContextIssue: true,
    });

    expect(scored.interaction.suspectedContextIssue).toBe(true);
    expect(scored.interaction.reviewStatus).toBe("Action proposed");
    expect(scored.interaction.contextFlagged).toBe("Flagged for review");
  });
});
