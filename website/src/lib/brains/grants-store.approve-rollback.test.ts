import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("approveKeyRequest grant-create rollback", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BRAIN_KEY_USE_MEMORY = "true";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unmock("./store/memory-store");
  });

  it("restores pending status when createGrant fails so approve can be retried", async () => {
    const { memoryStore } = await import("./store/memory-store");
    const { resetMemoryStoreForTests } = await import("./grants-store");
    resetMemoryStoreForTests();

    const req = await memoryStore.createRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-approve-rollback",
      requestedExpiryMinutes: 30,
    });

    const createGrantSpy = vi
      .spyOn(memoryStore, "createGrant")
      .mockRejectedValueOnce(new Error("Airtable grant create failed"));

    const { approveKeyRequest, getKeyRequest } = await import("./grants-store");

    await expect(
      approveKeyRequest({
        requestId: req.requestId,
        approver: "Matthew",
      }),
    ).rejects.toThrow(/Airtable grant create failed/);

    const after = await getKeyRequest(req.requestId);
    expect(after?.status).toBe("pending");
    expect(createGrantSpy).toHaveBeenCalledOnce();

    createGrantSpy.mockRestore();

    const grant = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
    });
    expect(grant?.grantId).toMatch(/^grt_/);
    expect((await getKeyRequest(req.requestId))?.status).toBe("approved");
  });
});
