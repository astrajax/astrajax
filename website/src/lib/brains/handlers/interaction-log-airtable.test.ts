import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleInteractionLog } from "./interaction-log";

beforeEach(() => {
  process.env.BRAIN_KEY_USE_MEMORY = "false";
  process.env.BRAIN_WORKSHOP_BASE_ID = "appWorkshop";
  process.env.BRAIN_WORKSHOP_WRITE_TOKEN = "test-token";
  process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID = "tblInteractions";
  process.env.INTERACTION_WRITE_TARGET = "brain_interactions";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BRAIN_KEY_USE_MEMORY;
  delete process.env.BRAIN_WORKSHOP_BASE_ID;
  delete process.env.BRAIN_WORKSHOP_WRITE_TOKEN;
  delete process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID;
  delete process.env.INTERACTION_WRITE_TARGET;
});

describe("Workshop interaction single-create response", () => {
  it("reads Airtable's top-level id instead of reporting a successful write as failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "recCreated123", fields: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await handleInteractionLog({
      sessionId: "session-1",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "What changed?",
      assistantReply: "The parser now reads the single-create response correctly.",
    });

    expect(result.recordId).toBe("recCreated123");
  });
});
