import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./knowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./knowledge")>();
  return {
    ...actual,
    loadCurationDocket: vi.fn(),
  };
});

vi.mock("@/lib/brains/trusted-truth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/brains/trusted-truth")>();
  return {
    ...actual,
    retrieveTrustedSnippets: vi.fn(async () => []),
  };
});

vi.mock("@/lib/brains/handlers/interaction-log", () => ({
  handleInteractionLog: vi.fn(async () => ({ mode: "memory", logged: true })),
}));

vi.mock("@/lib/platform-activity/config", () => ({
  platformActivityEventWritesEnabled: vi.fn(() => false),
}));

vi.mock("@/lib/platform-activity/server", () => ({
  queueTurnWithModelCall: vi.fn(),
  queueChildModelCall: vi.fn(),
}));

import { loadCurationDocket } from "./knowledge";
import { handleInteractionLog } from "@/lib/brains/handlers/interaction-log";
import { platformActivityEventWritesEnabled } from "@/lib/platform-activity/config";
import { queueTurnWithModelCall } from "@/lib/platform-activity/server";
import { runCurationChat, sanitiseCurationHistory } from "./orchestrator";
import type { CurationDocket } from "./types";

const docketMock = vi.mocked(loadCurationDocket);
const logMock = vi.mocked(handleInteractionLog);
const platformEnabledMock = vi.mocked(platformActivityEventWritesEnabled);
const queueTurnMock = vi.mocked(queueTurnWithModelCall);

const emptyDocket: CurationDocket = {
  brainSlug: "astrajax-chapter-1",
  mode: "memory",
  drafts: [],
  flaggedInteractions: [],
  pendingSourceDocuments: [],
  trustedTruths: [],
};

function anthropicTextReply(text: string) {
  return {
    id: "msg_test",
    model: "claude-test",
    stop_reason: "end_turn",
    usage: { input_tokens: 10, output_tokens: 5 },
    content: [{ type: "text", text }],
  };
}

describe("sanitiseCurationHistory", () => {
  it("returns an empty list for non-arrays and empty content", () => {
    expect(sanitiseCurationHistory(undefined)).toEqual([]);
    expect(sanitiseCurationHistory({ role: "user" })).toEqual([]);
    expect(
      sanitiseCurationHistory([{ role: "user", content: "   " }, { role: "system", content: "x" }]),
    ).toEqual([]);
  });

  it("keeps only the last ten trimmed user/assistant turns and caps length", () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: ` turn-${index} `,
    }));
    const sanitised = sanitiseCurationHistory(history);

    expect(sanitised).toHaveLength(10);
    expect(sanitised[0]).toEqual({ role: "user", content: "turn-2" });
    expect(sanitised[9]).toEqual({ role: "assistant", content: "turn-11" });

    const long = "x".repeat(900);
    expect(sanitiseCurationHistory([{ role: "user", content: long }])[0]?.content).toHaveLength(
      800,
    );
  });
});

describe("runCurationChat", () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    docketMock.mockReset();
    logMock.mockReset();
    platformEnabledMock.mockReset();
    queueTurnMock.mockReset();
    docketMock.mockResolvedValue(emptyDocket);
    platformEnabledMock.mockReturnValue(false);
    logMock.mockResolvedValue({ mode: "memory", logged: true } as never);
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(anthropicTextReply("Here is a curation reply.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
    vi.clearAllMocks();
  });

  it("rejects blank and over-long messages before calling the model", async () => {
    await expect(
      runCurationChat({
        brainSlug: "astrajax-chapter-1",
        sessionId: "sess-1",
        message: "   ",
        history: [],
      }),
    ).rejects.toThrow(/message is required/);

    await expect(
      runCurationChat({
        brainSlug: "astrajax-chapter-1",
        sessionId: "sess-1",
        message: "x".repeat(801),
        history: [],
      }),
    ).rejects.toThrow(/800 characters or fewer/);

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("logs to Workshop when platform activity writes are off", async () => {
    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "What drafts need attention?",
      history: [],
    });

    expect(result.reply).toBe("Here is a curation reply.");
    expect(result.knowledgeSource).toBe("fallback");
    expect(queueTurnMock).not.toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-curate",
        brainSlug: "astrajax-chapter-1",
        userMessage: "What drafts need attention?",
        assistantReply: "Here is a curation reply.",
        channel: "website",
      }),
    );
  });

  it("falls back to Workshop logging when platform queue throws", async () => {
    platformEnabledMock.mockReturnValue(true);
    queueTurnMock.mockRejectedValue(new Error("outbox unavailable"));

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Queue this turn",
      history: [],
      platformHandle: "handle.signed",
      turnId: "turn-1",
    });

    expect(result.reply).toBe("Here is a curation reply.");
    expect(queueTurnMock).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-curate",
        userMessage: "Queue this turn",
      }),
    );
  });

  it("accepts a source-qualified quarantine proposal that matches the docket", async () => {
    docketMock.mockResolvedValue({
      ...emptyDocket,
      flaggedInteractions: [
        {
          recordId: "recFlaggedTurn0001",
          source: "household_activity",
          stableId: "household_activity:recFlaggedTurn0001",
          userMessage: "Should this be quarantined?",
          assistantReply: "Maybe.",
        },
      ],
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "msg_tools",
            model: "claude-test",
            stop_reason: "tool_use",
            usage: { input_tokens: 12, output_tokens: 8 },
            content: [
              {
                type: "tool_use",
                id: "toolu_q1",
                name: "propose_quarantine",
                input: {
                  recordId: "recFlaggedTurn0001",
                  source: "household_activity",
                  reason: "Looks off-scope for this brain.",
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Queued quarantine for confirmation.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Quarantine the flagged turn",
      history: [],
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]).toMatchObject({
      toolName: "propose_quarantine",
      destination: "household-activity",
      payload: {
        recordId: "recFlaggedTurn0001",
        source: "household_activity",
      },
      status: "pending",
    });
    expect(result.reply).toBe("Queued quarantine for confirmation.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects quarantine proposals that do not match a source-qualified docket record", async () => {
    docketMock.mockResolvedValue({
      ...emptyDocket,
      flaggedInteractions: [
        {
          recordId: "recFlaggedTurn0001",
          source: "brain_interactions",
          stableId: "brain_interactions:recFlaggedTurn0001",
          userMessage: "On the workshop table",
          assistantReply: "Noted.",
        },
      ],
    });

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "msg_bad_tool",
          model: "claude-test",
          stop_reason: "tool_use",
          usage: { input_tokens: 12, output_tokens: 8 },
          content: [
            {
              type: "tool_use",
              id: "toolu_bad",
              name: "propose_quarantine",
              input: {
                // Same id, wrong source — must not invent a Workshop action.
                recordId: "recFlaggedTurn0001",
                source: "household_activity",
                reason: "Wrong table.",
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      runCurationChat({
        brainSlug: "astrajax-chapter-1",
        sessionId: "sess-curate",
        message: "Quarantine that turn",
        history: [],
      }),
    ).rejects.toThrow(/source-qualified docket record/);
  });
});
