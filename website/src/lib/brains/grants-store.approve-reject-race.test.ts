import { beforeEach, describe, expect, it } from "vitest";
import {
  approveKeyRequest,
  createKeyRequest,
  getGrant,
  getKeyRequest,
  rejectKeyRequest,
  resetMemoryStoreForTests,
} from "./grants-store";

describe("approve↔reject Status races", () => {
  beforeEach(() => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    resetMemoryStoreForTests();
  });

  async function pendingRequest() {
    return createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "race test",
      sessionId: "session-approve-reject-race",
    });
  }

  it("rejects a pending request and leaves no Active grant", async () => {
    const req = await pendingRequest();
    const ok = await rejectKeyRequest(req.requestId);
    expect(ok).toBe(true);
    expect((await getKeyRequest(req.requestId))?.status).toBe("rejected");
    expect(await approveKeyRequest({ requestId: req.requestId, approver: "Matthew" })).toBeNull();
  });

  it("revokes an Active grant when reject lands after approve", async () => {
    const req = await pendingRequest();
    const grant = await approveKeyRequest({ requestId: req.requestId, approver: "Matthew" });
    expect(grant?.status).toBe("active");

    const ok = await rejectKeyRequest(req.requestId);
    expect(ok).toBe(true);
    expect((await getKeyRequest(req.requestId))?.status).toBe("rejected");
    expect((await getGrant(grant!.grantId))?.status).toBe("revoked");
  });

  it("approve fails closed when Status is rejected before mint returns", async () => {
    const req = await pendingRequest();
    const store = await import("./store/memory-store");

    const originalCreate = store.memoryStore.createGrant.bind(store.memoryStore);
    store.memoryStore.createGrant = async (input) => {
      // Simulate reject winning the Status write while approve is minting.
      await store.memoryStore.setRequestStatus(input.requestId, "rejected");
      return originalCreate(input);
    };

    try {
      const grant = await approveKeyRequest({ requestId: req.requestId, approver: "Matthew" });
      expect(grant).toBeNull();
      expect((await getKeyRequest(req.requestId))?.status).toBe("rejected");
    } finally {
      store.memoryStore.createGrant = originalCreate;
    }
  });

  it("reject re-asserts after approve overwrites Status mid-reject", async () => {
    const req = await pendingRequest();
    const store = await import("./store/memory-store");

    let statusWrites = 0;
    const originalSet = store.memoryStore.setRequestStatus.bind(store.memoryStore);
    store.memoryStore.setRequestStatus = async (requestId, status) => {
      const ok = await originalSet(requestId, status);
      statusWrites += 1;
      // First reject write — approve races in and claims approved + mints.
      if (status === "rejected" && statusWrites === 1) {
        await originalSet(requestId, "approved");
        await store.memoryStore.createGrant({
          requestId,
          brainSlug: "astrajax-chapter-1",
          persona: "clive",
          scope: "read:brain-truth:positioning",
          sessionId: "session-approve-reject-race",
          approvedBy: "Matthew",
          grantMaxUses: 1,
          grantExpiryMinutes: 15,
        });
      }
      return ok;
    };

    try {
      const ok = await rejectKeyRequest(req.requestId);
      expect(ok).toBe(true);
      expect((await getKeyRequest(req.requestId))?.status).toBe("rejected");

      const listed = await store.memoryStore.listGrantsByRequestId(req.requestId);
      expect(listed.every((g) => g.status !== "active")).toBe(true);
    } finally {
      store.memoryStore.setRequestStatus = originalSet;
    }
  });
});
