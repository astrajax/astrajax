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

  it("returns pending-docket counts without creating a proposal", async () => {
    docketMock.mockResolvedValue({
      ...emptyDocket,
      drafts: [
        {
          recordId: "recDraft000000001",
          title: "Draft A",
          canonicalText: "Body",
          status: "Draft",
        },
      ],
      flaggedInteractions: [
        {
          recordId: "recFlag0000000001",
          source: "brain_interactions",
          stableId: "brain_interactions:recFlag0000000001",
          userMessage: "Hi",
          assistantReply: "Hello",
        },
      ],
      pendingSourceDocuments: [
        {
          recordId: "recSrc00000000001",
          title: "Source pack",
        },
      ],
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "msg_docket",
            model: "claude-test",
            stop_reason: "tool_use",
            usage: { input_tokens: 8, output_tokens: 4 },
            content: [
              {
                type: "tool_use",
                id: "toolu_docket",
                name: "get_pending_docket",
                input: {},
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Three items waiting.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "What is pending?",
      history: [],
    });

    expect(result.proposals).toEqual([]);
    expect(result.reply).toBe("Three items waiting.");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const followUpBody = JSON.parse(
      String((fetchMock.mock.calls[1]?.[1] as RequestInit | undefined)?.body ?? "{}"),
    ) as {
      messages?: Array<{
        role: string;
        content: Array<{ type: string; content?: string }>;
      }>;
    };
    const toolResult = followUpBody.messages
      ?.flatMap((turn) => (Array.isArray(turn.content) ? turn.content : []))
      .find((block) => block.type === "tool_result");
    expect(JSON.parse(toolResult?.content ?? "{}")).toEqual({
      drafts: 1,
      flaggedInteractions: 1,
      pendingSourceDocuments: 1,
    });
  });

  it("queues propose_draft_truth and promote_to_trusted proposals with correct destinations", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "msg_multi",
            model: "claude-test",
            stop_reason: "tool_use",
            usage: { input_tokens: 20, output_tokens: 12 },
            content: [
              {
                type: "tool_use",
                id: "toolu_draft",
                name: "propose_draft_truth",
                input: {
                  title: "Agents propose; humans approve",
                  canonicalText: "Judgement stays with the Architect.",
                  proposedCategory: "Definition",
                },
              },
              {
                type: "tool_use",
                id: "toolu_promote",
                name: "promote_to_trusted",
                input: {
                  draftRecordId: "recDraftPromote001",
                  category: "Definition",
                  scope: "read:brain-truth:positioning",
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(anthropicTextReply("Two proposals await your confirmation.")),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Draft that definition and promote the ready row",
      history: [],
    });

    expect(result.proposals).toHaveLength(2);
    expect(result.proposals[0]).toMatchObject({
      toolName: "propose_draft_truth",
      title: "Agents propose; humans approve",
      destination: "workshop-draft-truth",
      status: "pending",
      payload: {
        title: "Agents propose; humans approve",
        proposedCategory: "Definition",
      },
    });
    expect(result.proposals[1]).toMatchObject({
      toolName: "promote_to_trusted",
      title: "Promote draft to Trusted",
      destination: "trusted-brain-truth",
      status: "pending",
      payload: {
        draftRecordId: "recDraftPromote001",
        category: "Definition",
        scope: "read:brain-truth:positioning",
      },
    });
    expect(result.reply).toBe("Two proposals await your confirmation.");
  });

  it("routes mark_no_action on household activity to the household destination", async () => {
    docketMock.mockResolvedValue({
      ...emptyDocket,
      flaggedInteractions: [
        {
          recordId: "recHouseHoldTurn01",
          source: "household_activity",
          stableId: "household_activity:recHouseHoldTurn01",
          userMessage: "Noise",
          assistantReply: "Noted.",
        },
      ],
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "msg_no_action",
            model: "claude-test",
            stop_reason: "tool_use",
            usage: { input_tokens: 10, output_tokens: 6 },
            content: [
              {
                type: "tool_use",
                id: "toolu_no_action",
                name: "mark_no_action",
                input: {
                  recordId: "recHouseHoldTurn01",
                  source: "household_activity",
                  reason: "Already handled offline.",
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Marked no action.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Close that household turn",
      history: [],
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]).toMatchObject({
      toolName: "mark_no_action",
      destination: "household-activity",
      payload: {
        recordId: "recHouseHoldTurn01",
        source: "household_activity",
      },
    });
  });
});
