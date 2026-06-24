import { describe, expect, it } from "vitest";
import { deriveBrainKeyUiState, cliveMessageForState, UI_STATE_LABELS } from "./ui-states";
import type { AccessGrant, BrainKeyRequest } from "./types";

const baseRequest: BrainKeyRequest = {
  requestId: "bkr_test",
  brainSlug: "astrajax-chapter-1",
  persona: "clive",
  purpose: "demo",
  scope: "read:brain-context:pricing",
  reason: "booth",
  sessionId: "s1",
  status: "pending",
  requestedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};

describe("Brain Key UI states", () => {
  it("starts locked without a request", () => {
    expect(deriveBrainKeyUiState({ brainSlug: "astrajax-chapter-1" })).toBe("locked");
  });

  it("shows awaiting_approval when pending (human only, no Pam gate)", () => {
    expect(
      deriveBrainKeyUiState({ brainSlug: "astrajax-chapter-1", request: baseRequest }),
    ).toBe("awaiting_approval");
  });

  it("shows unlocked with active grant", () => {
    const grant: AccessGrant = {
      grantId: "grt_test",
      requestId: "bkr_test",
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      scope: "read:brain-context:pricing",
      sessionId: "s1",
      approvedBy: "Matthew",
      approvedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      maxUses: 3,
      useCount: 0,
      status: "active",
    };
    expect(deriveBrainKeyUiState({ brainSlug: "astrajax-chapter-1", grant })).toBe("unlocked");
  });

  it("never mentions credentials or keys in Clive copy", () => {
    for (const state of ["locked", "key_requested", "unlocked", "expired"] as const) {
      const msg = cliveMessageForState(state);
      expect(msg.toLowerCase()).not.toContain("api key");
      expect(msg.toLowerCase()).not.toContain("bearer");
      expect(msg.toLowerCase()).not.toContain("brain key");
    }
  });

  it("uses approved-context language in public labels", () => {
    expect(UI_STATE_LABELS.unlocked).toContain("Approved context");
    expect(UI_STATE_LABELS.locked).toBe("Workshop only");
  });
});
