import { describe, expect, it } from "vitest";
import { parseToolInput, toolDestination } from "./tools";

describe("parseToolInput", () => {
  it("rejects non-object payloads", () => {
    expect(() => parseToolInput("propose_draft_truth", null)).toThrow(/Invalid input/);
    expect(() => parseToolInput("propose_draft_truth", "title")).toThrow(/Invalid input/);
  });

  it("requires a source-qualified interaction for quarantine and no-action tools", () => {
    expect(() =>
      parseToolInput("propose_quarantine", {
        recordId: "rec1",
        recordType: "interaction",
        reason: "off-thesis",
      }),
    ).toThrow(/valid interaction source/);

    expect(() =>
      parseToolInput("mark_no_action", {
        recordId: "rec1",
        source: "workshop",
        reason: "noise",
      }),
    ).toThrow(/valid interaction source/);
  });

  it("accepts brain_interactions and household_activity sources", () => {
    expect(
      parseToolInput("propose_quarantine", {
        recordId: "rec1",
        source: "brain_interactions",
        recordType: "interaction",
        reason: "drift",
      }),
    ).toMatchObject({ source: "brain_interactions" });

    expect(
      parseToolInput("mark_no_action", {
        recordId: "recHousehold1",
        source: "household_activity",
        reason: "duplicate",
      }),
    ).toMatchObject({ source: "household_activity" });
  });
});

describe("toolDestination", () => {
  it("routes each mutable tool to the correct home", () => {
    expect(toolDestination("promote_to_trusted")).toBe("trusted-brain-truth");
    expect(toolDestination("propose_quarantine")).toBe("workshop-interactions");
    expect(toolDestination("mark_no_action")).toBe("workshop-interactions");
    expect(toolDestination("route_intake_item")).toBe("workshop-source-document");
    expect(toolDestination("propose_draft_truth")).toBe("workshop-draft-truth");
    expect(toolDestination("propose_truth_edit")).toBe("workshop-draft-truth");
  });
});
