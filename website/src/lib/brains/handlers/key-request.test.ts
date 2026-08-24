import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetMemoryStoreForTests } from "../grants-store";
import { handleKeyRequest } from "./key-request";

describe("handleKeyRequest", () => {
  beforeEach(() => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    resetMemoryStoreForTests();
  });

  afterEach(() => {
    resetMemoryStoreForTests();
  });

  it("requires trimmed brainSlug, sessionId, purpose, scope, and reason", async () => {
    const base = {
      brainSlug: "astrajax-chapter-1",
      persona: "clive" as const,
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "coverage",
      sessionId: "sess-1",
    };

    await expect(handleKeyRequest({ ...base, brainSlug: "  " })).rejects.toThrow(
      /brainSlug is required/,
    );
    await expect(handleKeyRequest({ ...base, sessionId: "" })).rejects.toThrow(
      /sessionId is required/,
    );
    await expect(handleKeyRequest({ ...base, purpose: "\t" })).rejects.toThrow(
      /purpose is required/,
    );
    await expect(handleKeyRequest({ ...base, scope: " " })).rejects.toThrow(
      /scope is required/,
    );
    await expect(handleKeyRequest({ ...base, reason: "" })).rejects.toThrow(
      /reason is required/,
    );
  });

  it("creates a pending request that always requires human approval", async () => {
    const result = await handleKeyRequest({
      brainSlug: "  astrajax-chapter-1  ",
      persona: "clive",
      purpose: "  demo  ",
      scope: "  read:brain-truth:positioning  ",
      reason: "  coverage  ",
      sessionId: "  sess-trim  ",
    });

    expect(result.status).toBe("pending");
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.requestId).toMatch(/^bkr_/);
    expect(result.expiresAt).toBeTruthy();
  });
});
