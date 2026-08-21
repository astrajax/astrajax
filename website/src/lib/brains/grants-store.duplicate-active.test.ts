import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  approveKeyRequest,
  createKeyRequest,
  getGrant,
  resetMemoryStoreForTests,
} from "./grants-store";
import { memoryStore } from "./store/memory-store";

/**
 * Race recovery: two Active grants for one request must collapse to the
 * earliest-approved key, with the duplicate revoked — not left usable.
 */
describe("approveKeyRequest duplicate Active collapse", () => {
  beforeEach(() => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    resetMemoryStoreForTests();
  });

  afterEach(() => {
    resetMemoryStoreForTests();
  });

  it("keeps the earliest Active grant and revokes the later duplicate", async () => {
    const req = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "race",
      sessionId: "session-duplicate-active",
    });

    await memoryStore.setRequestStatus(req.requestId, "approved");

    const earlier = await memoryStore.createGrant({
      requestId: req.requestId,
      brainSlug: req.brainSlug,
      persona: req.persona,
      scope: req.scope,
      sessionId: req.sessionId,
      approvedBy: "Matthew",
      grantMaxUses: 5,
      grantExpiryMinutes: 30,
    });
    const later = await memoryStore.createGrant({
      requestId: req.requestId,
      brainSlug: req.brainSlug,
      persona: req.persona,
      scope: req.scope,
      sessionId: req.sessionId,
      approvedBy: "Matthew",
      grantMaxUses: 5,
      grantExpiryMinutes: 30,
    });

    // Stable ordering for the collapse sort (same-second stamps are ambiguous).
    const earlierRow = await memoryStore.getGrant(earlier.grantId);
    const laterRow = await memoryStore.getGrant(later.grantId);
    if (!earlierRow || !laterRow) throw new Error("expected both grants");
    earlierRow.approvedAt = "2026-08-20T10:00:00.000Z";
    laterRow.approvedAt = "2026-08-20T10:00:01.000Z";

    const kept = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
    });

    expect(kept?.grantId).toBe(earlier.grantId);
    expect(kept?.status).toBe("active");
    expect((await getGrant(later.grantId))?.status).toBe("revoked");
    expect((await getGrant(earlier.grantId))?.status).toBe("active");
  });
});
