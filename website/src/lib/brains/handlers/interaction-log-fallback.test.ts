import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleInteractionLog } from "./interaction-log";

describe("Workshop interaction log does not silently drop writes", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.BRAIN_WORKSHOP_BASE_ID = "appWorkshop";
    process.env.BRAIN_WORKSHOP_WRITE_TOKEN = "test-token";
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID = "tblInteractions";
    // Cutover flag that previously caused a fake logged:true with no Airtable write.
    process.env.INTERACTION_WRITE_TARGET = "household_activity";
    delete process.env.PLATFORM_ACTIVITY_EVENT_WRITES_ENABLED;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("still persists to Workshop when Household is the write target", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: "recWorkshop1", fields: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await handleInteractionLog({
      sessionId: "session-1",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "What should stay in the review queue?",
      assistantReply: "This exchange must not vanish when platform writes are off.",
    });

    expect(result.logged).toBe(true);
    expect(result.recordId).toBe("recWorkshop1");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain("tblInteractions");
  });
});
