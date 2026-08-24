import { describe, expect, it } from "vitest";
import {
  assertNeverExposeToModel,
  assertSafeForPersistence,
  containsSecretMaterial,
  redactSecrets,
  sanitizeForClient,
  sanitizeInteractionForPersistence,
} from "./secrets";

describe("containsSecretMaterial / redactSecrets", () => {
  it("flags Bearer, Airtable pats, env-style token names, and app base ids", () => {
    expect(containsSecretMaterial("Bearer FAKESECRET_g2h3i4j5k6l7m8n9o0p1")).toBe(true);
    expect(containsSecretMaterial("patABCDEFGHIJKLMNOPQRSTUV")).toBe(true);
    expect(containsSecretMaterial("BRAIN_WORKSHOP_WRITE_TOKEN")).toBe(true);
    expect(containsSecretMaterial("AIRTABLE_API_TOKEN")).toBe(true);
    expect(containsSecretMaterial("appF7jQD4ZKrDC7e1")).toBe(true);
  });

  it("leaves ordinary coaching copy alone", () => {
    const copy = "Keep the thesis tight: domain experts become architects.";
    expect(containsSecretMaterial(copy)).toBe(false);
    expect(redactSecrets(copy)).toBe(copy);
  });

  it("redacts embedded credentials without dropping the surrounding sentence", () => {
    const raw = "Retry with Bearer FAKESECRET_g2h3i4j5k6l7m8n9o0p1 then continue.";
    expect(redactSecrets(raw)).toBe("Retry with [REDACTED] then continue.");
  });
});

describe("sanitizeForClient", () => {
  it("redacts nested strings and keys that look like secrets", () => {
    const out = sanitizeForClient({
      ok: true,
      nested: {
        note: "token patABCDEFGHIJKLMNOPQRSTUV",
        items: ["plain", "Bearer FAKESECRET_g2h3i4j5k6l7m8n9o0p1"],
      },
      BRAIN_TRUSTED_READ_TOKEN: "should-never-leave",
      workshopSecret: "also-hidden",
      accessToken: "header-value",
    }) as {
      ok: boolean;
      nested: { note: string; items: string[] };
      BRAIN_TRUSTED_READ_TOKEN: string;
      workshopSecret: string;
      accessToken: string;
    };

    expect(out.ok).toBe(true);
    expect(out.nested.note).toContain("[REDACTED]");
    expect(out.nested.items[0]).toBe("plain");
    expect(out.nested.items[1]).toContain("[REDACTED]");
    expect(out.BRAIN_TRUSTED_READ_TOKEN).toBe("[REDACTED]");
    expect(out.workshopSecret).toBe("[REDACTED]");
    expect(out.accessToken).toBe("[REDACTED]");
  });
});

describe("persistence and model gates", () => {
  it("assertSafeForPersistence refuses secret-like review notes", () => {
    expect(() => assertSafeForPersistence("Looks thin")).not.toThrow();
    expect(() =>
      assertSafeForPersistence("Use Bearer FAKESECRET_g2h3i4j5k6l7m8n9o0p1"),
    ).toThrow(/secret-like material/);
  });

  it("assertNeverExposeToModel refuses credentials in model content", () => {
    expect(() => assertNeverExposeToModel("Coach on positioning")).not.toThrow();
    expect(() =>
      assertNeverExposeToModel("AIRTABLE_API_TOKEN must not appear here"),
    ).toThrow(/must not include Brain Key or API credentials/);
  });

  it("sanitizeInteractionForPersistence scrubs messages but keeps manifest ids", () => {
    const cleaned = sanitizeInteractionForPersistence({
      userMessage: "Please inspect Bearer FAKESECRET_g2h3i4j5k6l7m8n9o0p1 before coaching.",
      assistantReply: "api_key=sk-abcdefghijklmnopqrstuvwxyz123456 is not needed.",
      manifest: {
        grantId: "grt_demo",
        recordIds: ["recABC"],
        hashes: ["sha256:abc"],
      },
    });

    expect(cleaned.userMessage).toContain("[REDACTED_CREDENTIAL]");
    expect(cleaned.userMessage).not.toMatch(/Bearer\s+[A-Za-z0-9]/);
    expect(cleaned.assistantReply).toContain("[REDACTED_CREDENTIAL]");
    expect(cleaned.manifest).toEqual({
      grantId: "grt_demo",
      recordIds: ["recABC"],
      hashes: ["sha256:abc"],
    });
  });
});
