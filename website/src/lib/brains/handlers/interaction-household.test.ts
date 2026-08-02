import { describe, expect, it } from "vitest";
import {
  buildHouseholdBrainTurnFormula,
  mapHouseholdRecord,
} from "./interaction-household";

describe("Household Activity interaction projection", () => {
  it("filters Turns by brainSlug inside Detail before the global fetch cap", () => {
    expect(buildHouseholdBrainTurnFormula("astrajax-chapter-1")).toBe(
      `AND({Event Type}='Turn', FIND('"brainSlug":"astrajax-chapter-1"', {Detail}))`,
    );
    expect(buildHouseholdBrainTurnFormula("brain's-slug")).toBe(
      `AND({Event Type}='Turn', FIND('"brainSlug":"brain\\'s-slug"', {Detail}))`,
    );
  });

  it("maps Agent Quality without touching Human Quality and preserves source identity", () => {
    const interaction = mapHouseholdRecord({
      id: "recActivity1",
      createdTime: "2026-07-26T10:00:00.000Z",
      fields: {
        "Event ID": "evt-1",
        "Session ID": "platform-1",
        "Event Type": "Turn",
        "User Message": "How should I frame this prompt?",
        "Reply Digest": "Use the decision and evidence in the opening line.",
        "Agent Quality": 4,
        "Human Quality": 5,
        "Review Status": "Reviewed",
        Detail: JSON.stringify({
          surface: "ask-clive",
          persona: "clive",
          brainSlug: "astrajax-chapter-1",
          manifest: { recordIds: ["recTruth1"] },
        }),
      },
    });

    expect(interaction.source).toBe("household_activity");
    expect(interaction.stableId).toBe("household_activity:recActivity1");
    expect(interaction.qualityScore).toBe(4);
    expect(interaction.agentQuality).toBe(4);
    expect(interaction.humanQuality).toBe(5);
    expect(interaction.manifestRecordIds).toEqual(["recTruth1"]);
    expect(interaction.contentComplete).toBe(false);
  });
});
