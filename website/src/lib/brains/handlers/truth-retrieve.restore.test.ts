import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("handleTruthRetrieve restore on Trusted fetch failure", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    delete process.env.BRAIN_TRUSTED_READ_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("restores the spent use when Trusted snippet fetch throws", async () => {
    vi.doMock("../trusted-truth", () => ({
      retrieveTrustedSnippets: vi
        .fn()
        .mockRejectedValueOnce(new Error("Airtable API error 503: Unavailable"))
        .mockResolvedValueOnce([
          {
            recordId: "recTruth",
            title: "Pricing",
            text: "Canonical pricing truth",
            contentHash: "sha256:abc",
            scope: "read:brain-truth:pricing",
          },
        ]),
    }));

    const {
      resetMemoryStoreForTests,
      createKeyRequest,
      approveKeyRequest,
      getGrant,
    } = await import("../grants-store");
    const { handleTruthRetrieve } = await import("./truth-retrieve");

    resetMemoryStoreForTests();

    const req = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-restore-use",
      requestedExpiryMinutes: 30,
    });

    const grant = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
      grantMaxUses: 1,
    });
    expect(grant?.grantId).toBeTruthy();

    await expect(
      handleTruthRetrieve({
        grantId: grant!.grantId,
        sessionId: "session-restore-use",
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        scope: "read:brain-truth:pricing",
      }),
    ).rejects.toThrow(/503/);

    const afterFailure = await getGrant(grant!.grantId);
    expect(afterFailure?.useCount).toBe(0);
    expect(afterFailure?.status).toBe("active");

    const recovered = await handleTruthRetrieve({
      grantId: grant!.grantId,
      sessionId: "session-restore-use",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      scope: "read:brain-truth:pricing",
    });
    expect(recovered.snippets).toHaveLength(1);
    expect(recovered.remainingUses).toBe(0);
  });

  it("restores the spent use when a wired Trusted read returns only fallback snippets", async () => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    process.env.BRAIN_TRUSTED_READ_TOKEN = "patTrustedRead";

    vi.doMock("../trusted-truth", () => ({
      retrieveTrustedSnippets: vi
        .fn()
        .mockResolvedValueOnce([
          {
            recordId: "fallback-positioning",
            title: "What AstraJax is",
            text: "Public placeholder — not Trusted Brain.",
            contentHash: "sha256:fallback",
          },
        ])
        .mockResolvedValueOnce([
          {
            recordId: "recTruth",
            title: "Pricing",
            text: "Canonical pricing truth",
            contentHash: "sha256:abc",
            scope: "read:brain-truth:pricing",
          },
        ]),
    }));

    const {
      resetMemoryStoreForTests,
      createKeyRequest,
      approveKeyRequest,
      getGrant,
    } = await import("../grants-store");
    const { handleTruthRetrieve } = await import("./truth-retrieve");

    resetMemoryStoreForTests();

    const req = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-fallback-use",
      requestedExpiryMinutes: 30,
    });

    const grant = await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
      grantMaxUses: 1,
    });
    expect(grant?.grantId).toBeTruthy();

    await expect(
      handleTruthRetrieve({
        grantId: grant!.grantId,
        sessionId: "session-fallback-use",
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        scope: "read:brain-truth:pricing",
      }),
    ).rejects.toThrow(/No Trusted Brain truth/);

    const afterFallback = await getGrant(grant!.grantId);
    expect(afterFallback?.useCount).toBe(0);
    expect(afterFallback?.status).toBe("active");

    const recovered = await handleTruthRetrieve({
      grantId: grant!.grantId,
      sessionId: "session-fallback-use",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      scope: "read:brain-truth:pricing",
    });
    expect(recovered.snippets[0]?.recordId).toBe("recTruth");
    expect(recovered.remainingUses).toBe(0);
  });
});
