import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Promote-path revoke is covered elsewhere (#189 / #205). This pins the
 * grants-store wrapper: paper trail is best-effort and must never undo a
 * completed revoke when the Change Log write fails.
 */
describe("revokeGrantsForBrain paper trail", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BRAIN_KEY_USE_MEMORY = "true";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("still returns the revoke count when appendChangeLog fails", async () => {
    const appendChangeLog = vi.fn().mockRejectedValue(new Error("Change Log tip lookup failed"));
    vi.doMock("./change-log", () => ({ appendChangeLog }));

    const {
      resetMemoryStoreForTests,
      createKeyRequest,
      approveKeyRequest,
      revokeGrantsForBrain,
    } = await import("./grants-store");
    resetMemoryStoreForTests();

    const req = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-revoke-changelog",
    });
    await approveKeyRequest({ requestId: req.requestId, approver: "Matthew" });

    const count = await revokeGrantsForBrain("astrajax-chapter-1");
    expect(count).toBe(1);
    expect(appendChangeLog).toHaveBeenCalledTimes(2); // mint + revoke
    expect(appendChangeLog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        changeType: "Grant Revoked",
        affectedRecords: "astrajax-chapter-1",
        changeSummary: expect.stringContaining("Revoked 1 grant"),
      }),
    );
  });

  it("skips the paper trail when nothing was revoked", async () => {
    const appendChangeLog = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./change-log", () => ({ appendChangeLog }));

    const { resetMemoryStoreForTests, revokeGrantsForBrain } = await import("./grants-store");
    resetMemoryStoreForTests();

    const count = await revokeGrantsForBrain("brain-with-no-grants");
    expect(count).toBe(0);
    expect(appendChangeLog).not.toHaveBeenCalled();
  });
});
