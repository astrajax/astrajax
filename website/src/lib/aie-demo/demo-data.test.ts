import { describe, expect, it } from "vitest";
import {
  FALLBACK_WORKSHOP_DRAFT,
  mergeDraftTruthsForDisplay,
  promotionsFromDrafts,
} from "./demo-data";
import type { DraftTruthItem, UserBrainIntake } from "./types";

function completedIntake(overrides: Partial<UserBrainIntake> = {}): UserBrainIntake {
  return {
    rawAnswers: [],
    questionIndex: 6,
    intakeComplete: true,
    name: "Matthew",
    role: "Head of Sales",
    goal: "Turn domain expertise into a governed operating system",
    ...overrides,
  };
}

const workshopDraft: DraftTruthItem = {
  recordId: "recWorkshop1",
  title: "Workshop positioning",
  canonicalText: "Trusted line from Workshop.",
  proposedCategory: "Definition",
  brainTheme: "core",
  status: "Draft",
  proposedByAgent: "Clive Curator",
  scope: "read:brain-truth:core",
  source: "workshop",
};

describe("mergeDraftTruthsForDisplay", () => {
  it("prefers live Workshop drafts over session or fallback rows", () => {
    const result = mergeDraftTruthsForDisplay(
      "sess_1",
      completedIntake(),
      [workshopDraft],
    );

    expect(result).toEqual({
      drafts: [workshopDraft],
      source: "workshop",
    });
  });

  it("builds session drafts from completed intake when Workshop is empty", () => {
    const result = mergeDraftTruthsForDisplay("sess_42", completedIntake(), []);

    expect(result.source).toBe("session");
    expect(result.notice).toMatch(/Workshop is empty/i);
    expect(result.drafts.map((d) => d.recordId)).toEqual([
      "session_sess_42_goal",
      "session_sess_42_role",
    ]);
    expect(result.drafts.every((d) => d.source === "session")).toBe(true);
  });

  it("falls back to the seeded demo draft when intake cannot produce rows", () => {
    const result = mergeDraftTruthsForDisplay("sess_empty", null, []);

    expect(result.source).toBe("fallback");
    expect(result.drafts).toEqual([FALLBACK_WORKSHOP_DRAFT]);
    expect(result.notice).toMatch(/seeded demo draft/i);
  });
});

describe("promotionsFromDrafts", () => {
  it("maps selected drafts to promote payloads and skips unknown ids", () => {
    const sessionDrafts: DraftTruthItem[] = [
      {
        recordId: "session_sess_1_goal",
        title: "Goal",
        canonicalText: "Ship the boring layer",
        proposedCategory: "Definition",
        brainTheme: "core",
        status: "Draft",
        scope: "read:brain-truth:core",
        source: "session",
      },
      {
        recordId: "session_sess_1_role",
        title: "Role",
        canonicalText: "Commercial lead",
        proposedCategory: "Knowledge",
        brainTheme: "people",
        status: "Draft",
        scope: "read:brain-truth:people",
        source: "session",
      },
    ];

    // Knowledge collapses to Definition for Trusted promote (categoryForPromote).
    expect(
      promotionsFromDrafts(sessionDrafts, [
        "session_sess_1_role",
        "missing",
        "session_sess_1_goal",
      ]),
    ).toEqual([
      {
        draftRecordId: "session_sess_1_role",
        category: "Definition",
        scope: "read:brain-truth:people",
      },
      {
        draftRecordId: "session_sess_1_goal",
        category: "Definition",
        scope: "read:brain-truth:core",
      },
    ]);
  });
});
