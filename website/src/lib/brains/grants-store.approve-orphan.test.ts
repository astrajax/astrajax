import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("approveKeyRequest orphan recovery", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BRAIN_KEY_USE_MEMORY = "true";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("still returns grantId when appendChangeLog fails after mint", async () => {
    vi.doMock("./change-log", () => ({
      appendChangeLog: vi.fn().mockRejectedValue(new Error("Change Log tip lookup failed")),
    }));

    const { resetMemoryStoreForTests, createKeyRequest, approveKeyRequest, getKeyRequest } =
      await import("./grants-store");
    resetMemoryStoreForTests();

    const req = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-orphan-changelog",
    });

    const grant = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
    });

    expect(grant?.grantId).toMatch(/^grt_/);
    expect((await getKeyRequest(req.requestId))?.status).toBe("approved");
  });

  it("returns the existing grant on retry when request is already approved", async () => {
    const { resetMemoryStoreForTests, createKeyRequest, approveKeyRequest } =
      await import("./grants-store");
    resetMemoryStoreForTests();

    const req = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-idempotent-approve",
    });

    const first = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
    });
    expect(first?.grantId).toMatch(/^grt_/);

    const second = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
    });
    expect(second?.grantId).toBe(first?.grantId);
  });
});
