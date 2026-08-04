import { describe, expect, it } from "vitest";
import {
  buildReceivingWallCliveFallback,
  buildReceivingWallCliveLoopContext,
  sanitiseReceivingWallCliveHistory,
} from "./receiving-wall-clive";

describe("receiving-wall Clive curation prompt", () => {
  it("puts the open record body into loop context and stays in curator register", () => {
    const loop = buildReceivingWallCliveLoopContext({
      openRecord: {
        recordId: "recOpenRecord0001",
        title: "Field travel policy draft",
        canonicalText: "Reps claim mileage only after EC sign-off.",
        provenance: "Clive's Man",
        captureSource: "chat",
        brainSlug: "astrajax-chapter-1",
        status: "Draft",
      },
      bayRecords: [
        {
          recordId: "recBayRecord00002",
          title: "Second bay item",
          provenance: "External capture",
          status: "Draft",
        },
      ],
    });

    expect(loop).toMatch(/Receiving Wall/i);
    expect(loop).toMatch(/curator|decide what each draft should become/i);
    expect(loop).toMatch(/Do not pitch Adoption OS Audit/);
    expect(loop).toContain("Field travel policy draft");
    expect(loop).toContain("Reps claim mileage only after EC sign-off.");
    expect(loop).toContain("Second bay item");
    expect(loop).toContain("OPEN RECORD");
  });

  it("fallback quotes the open record instead of the public explainer", () => {
    const reply = buildReceivingWallCliveFallback({
      message: "Tell me what it is",
      openRecord: {
        recordId: "recOpenRecord0001",
        title: "Field travel policy draft",
        canonicalText: "Reps claim mileage only after EC sign-off.",
      },
    });

    expect(reply).toContain("Field travel policy draft");
    expect(reply).toContain("Reps claim mileage only after EC sign-off.");
    expect(reply).not.toMatch(/Adoption OS Audit/i);
    expect(reply).not.toMatch(/public AstraJax website/i);
  });

  it("fallback without an open record invites a bench walk", () => {
    const reply = buildReceivingWallCliveFallback({
      message: "What needs deciding?",
    });
    expect(reply).toMatch(/wall holds|walk the bench/i);
    expect(reply).not.toMatch(/Adoption OS Audit/i);
  });

  it("sanitises history length and roles", () => {
    const history = sanitiseReceivingWallCliveHistory([
      { role: "user", content: "one" },
      { role: "system", content: "nope" },
      { role: "assistant", content: "two" },
      { role: "user", content: "" },
    ]);
    expect(history).toEqual([
      { role: "user", content: "one" },
      { role: "assistant", content: "two" },
    ]);
  });
});
