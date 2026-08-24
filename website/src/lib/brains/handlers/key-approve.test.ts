import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createKeyRequest,
  resetMemoryStoreForTests,
} from "../grants-store";
import { handleKeyApprove } from "./key-approve";

describe("handleKeyApprove", () => {
  beforeEach(() => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    resetMemoryStoreForTests();
  });

  afterEach(() => {
    resetMemoryStoreForTests();
  });

  it("requires requestId and approver", async () => {
    await expect(
      handleKeyApprove({
        requestId: "  ",
        approver: "Matthew",
        decision: "approved",
      }),
    ).rejects.toThrow(/requestId is required/);

    await expect(
      handleKeyApprove({
        requestId: "bkr_missing",
        approver: "",
        decision: "approved",
      }),
    ).rejects.toThrow(/approver is required/);
  });

  it("rejects a pending request without minting a grant", async () => {
    const request = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "coverage",
      sessionId: "sess-reject",
    });

    await expect(
      handleKeyApprove({
        requestId: request.requestId,
        approver: "Matthew",
        decision: "rejected",
      }),
    ).resolves.toEqual({
      requestId: request.requestId,
      status: "rejected",
    });

    await expect(
      handleKeyApprove({
        requestId: request.requestId,
        approver: "Matthew",
        decision: "rejected",
      }),
    ).rejects.toThrow(/not found or not pending/);
  });

  it("approves a pending request and returns grant metadata", async () => {
    const request = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "coverage",
      sessionId: "sess-approve",
    });

    const result = await handleKeyApprove({
      requestId: request.requestId,
      approver: "Matthew",
      decision: "approved",
      grantMaxUses: 3,
      notes: "booth",
    });

    expect(result).toMatchObject({
      status: "active",
      maxUses: 3,
      notes: "booth",
    });
    expect(result.grantId).toMatch(/^grt_/);
    expect(result.expiresAt).toBeTruthy();
  });

  it("refuses approve when the request is missing or already rejected", async () => {
    await expect(
      handleKeyApprove({
        requestId: "bkr_does_not_exist",
        approver: "Matthew",
        decision: "approved",
      }),
    ).rejects.toThrow(/Request not found/);

    const request = await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "coverage",
      sessionId: "sess-already-rejected",
    });
    await handleKeyApprove({
      requestId: request.requestId,
      approver: "Matthew",
      decision: "rejected",
    });

    await expect(
      handleKeyApprove({
        requestId: request.requestId,
        approver: "Matthew",
        decision: "approved",
      }),
    ).rejects.toThrow(/not pending approval/);
  });
});
