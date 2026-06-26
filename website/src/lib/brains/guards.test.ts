import { describe, expect, it, beforeEach } from "vitest";
import {
  assertApprovalDecisionPresent,
  assertPersonaMayRequestKey,
  assertRouteMayPromote,
  assertRouteMayReadTrusted,
  GrantValidationError,
  ROUTE_IDS,
  validateGrant,
  validatePersona,
} from "./guards";
import {
  approveKeyRequest,
  createKeyRequest,
  getGrant,
  resetMemoryStoreForTests,
} from "./grants-store";
import { handleTruthRetrieve } from "./handlers/truth-retrieve";
import { handleKeyRequest } from "./handlers/key-request";
import { handleInteractionLog, clearMemoryInteractionLogsForTests } from "./handlers/interaction-log";
import { handleDocPromote, clearMemoryPromotionsForTests } from "./handlers/doc-promote";
import { containsSecretMaterial, sanitizeForClient } from "./secrets";

const SESSION = "session-test-001";

beforeEach(() => {
  process.env.BRAIN_KEY_USE_MEMORY = "true";
  resetMemoryStoreForTests();
  clearMemoryInteractionLogsForTests();
  clearMemoryPromotionsForTests();
});

describe("Brain Key guards", () => {
  it("rejects Doc requesting a Brain Key", () => {
    expect(() => assertPersonaMayRequestKey("doc")).toThrow(/Doc does not request/);
  });

  it("rejects unknown personas at runtime", () => {
    expect(() => validatePersona("ceo")).toThrow(/Unknown persona/);
  });

  it("blocks trusted read routes except retrieve", () => {
    expect(() => assertRouteMayReadTrusted(ROUTE_IDS.KEY_REQUEST)).toThrow(/not permitted/);
    expect(() => assertRouteMayReadTrusted(ROUTE_IDS.TRUTH_RETRIEVE)).not.toThrow();
  });

  it("blocks promote routes except doc promote", () => {
    expect(() => assertRouteMayPromote(ROUTE_IDS.TRUTH_RETRIEVE)).toThrow(/not permitted/);
    expect(() => assertRouteMayPromote(ROUTE_IDS.DOC_PROMOTE)).not.toThrow();
  });

  it("requires approval decision for Doc promote", () => {
    expect(() => assertApprovalDecisionPresent(undefined)).toThrow(/approval decision/);
    expect(() => assertApprovalDecisionPresent("apd_123")).not.toThrow();
  });

  it("rejects retrieve without a grant", async () => {
    await expect(
      handleTruthRetrieve({
        grantId: "grt_missing",
        sessionId: SESSION,
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        scope: "read:brain-truth:pricing",
      }),
    ).rejects.toBeInstanceOf(GrantValidationError);
  });

  it("rejects grant with wrong session", async () => {
    const req = await handleKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "test",
      scope: "read:brain-truth:pricing",
      reason: "test",
      sessionId: SESSION,
    });
    const grant = await approveKeyRequest({ requestId: req.requestId, approver: "Matthew" });
    expect(grant).not.toBeNull();

    expect(() =>
      validateGrant({
        grant: grant!,
        sessionId: "wrong-session",
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        scope: "read:brain-truth:pricing",
      }),
    ).toThrow(/Session does not match/);
  });

  it("allows retrieve with valid grant then enforces max uses", async () => {
    const req = await handleKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: SESSION,
    });
    const grant = (await approveKeyRequest({
      requestId: req.requestId,
      approver: "Matthew",
      grantMaxUses: 1,
    }))!;

    const first = await handleTruthRetrieve({
      grantId: grant.grantId,
      sessionId: SESSION,
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      scope: "read:brain-truth:pricing",
    });
    expect(first.snippets.length).toBeGreaterThan(0);

    await expect(
      handleTruthRetrieve({
        grantId: grant.grantId,
        sessionId: SESSION,
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        scope: "read:brain-truth:pricing",
      }),
    ).rejects.toBeInstanceOf(GrantValidationError);

    const stored = await getGrant(grant.grantId);
    expect(stored?.status).toBe("expired");
  });
});

describe("Secret handling", () => {
  it("detects bearer tokens in payloads", () => {
    expect(containsSecretMaterial("Authorization: Bearer patAirtableFakeToken1234567890")).toBe(true);
  });

  it("redacts tokens from client responses", () => {
    const out = sanitizeForClient({
      note: "token patABC12345678901234567890",
      BRAIN_TRUSTED_READ_TOKEN: "secret",
    }) as { note: string; BRAIN_TRUSTED_READ_TOKEN: string };
    expect(out.note).toContain("[REDACTED]");
    expect(out.BRAIN_TRUSTED_READ_TOKEN).toBe("[REDACTED]");
  });

  it("rejects interaction logs containing secrets", async () => {
    await expect(
      handleInteractionLog({
        sessionId: SESSION,
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        userMessage: "Bearer patLeakedToken123456789012345",
        assistantReply: "ok",
      }),
    ).rejects.toThrow(/secret-like material/);
  });
});

describe("Doc promote", () => {
  it("rejects promote without approval decision id", async () => {
    await expect(
      handleDocPromote({
        approvalDecisionId: "",
        brainSlug: "astrajax-chapter-1",
        promotions: [
          {
            draftRecordId: "recDraft1",
            category: "Positioning",
            scope: "read:brain-truth:positioning",
          },
        ],
        approver: "Matthew",
        reason: "test",
      }),
    ).rejects.toThrow(/approval decision/);
  });
});

describe("Persona validation on handlers", () => {
  it("rejects key request from unknown persona", async () => {
    await expect(
      handleKeyRequest({
        brainSlug: "astrajax-chapter-1",
        persona: "ceo" as "clive",
        purpose: "test",
        scope: "read:brain-truth:positioning",
        reason: "test",
        sessionId: SESSION,
      }),
    ).rejects.toThrow(/Unknown persona/);
  });

  it("rejects interaction log from unknown persona", async () => {
    await expect(
      handleInteractionLog({
        sessionId: SESSION,
        persona: "ceo" as "clive",
        brainSlug: "astrajax-chapter-1",
        userMessage: "hello",
        assistantReply: "hi",
      }),
    ).rejects.toThrow(/Unknown persona/);
  });
});
