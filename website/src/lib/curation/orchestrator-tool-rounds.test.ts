import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Remaining curation tool / platform-round coverage.
 * Kept in a separate file so open coverage PR #176 can keep editing
 * orchestrator.test.ts without merge collisions.
 */

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
import {
  queueChildModelCall,
  queueTurnWithModelCall,
} from "@/lib/platform-activity/server";
import { runCurationChat } from "./orchestrator";
import type { CurationDocket } from "./types";

const docketMock = vi.mocked(loadCurationDocket);
const logMock = vi.mocked(handleInteractionLog);
const platformEnabledMock = vi.mocked(platformActivityEventWritesEnabled);
const queueTurnMock = vi.mocked(queueTurnWithModelCall);
const queueChildMock = vi.mocked(queueChildModelCall);

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

function toolUseResponse(
  name: string,
  input: Record<string, unknown>,
  id = "toolu_1",
) {
  return {
    id: "msg_tools",
    model: "claude-test",
    stop_reason: "tool_use",
    usage: { input_tokens: 12, output_tokens: 8 },
    content: [{ type: "tool_use" as const, id, name, input }],
  };
}

describe("runCurationChat remaining tools and rounds", () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    docketMock.mockReset();
    logMock.mockReset();
    platformEnabledMock.mockReset();
    queueTurnMock.mockReset();
    queueChildMock.mockReset();
    docketMock.mockResolvedValue(emptyDocket);
    platformEnabledMock.mockReturnValue(false);
    logMock.mockResolvedValue({ mode: "memory", logged: true } as never);
    queueTurnMock.mockResolvedValue(undefined as never);
    queueChildMock.mockResolvedValue(undefined as never);
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

  it("returns trusted truths via get_trusted_truths without creating proposals", async () => {
    docketMock.mockResolvedValue({
      ...emptyDocket,
      mode: "airtable",
      trustedTruths: [
        {
          recordId: "recTrusted001",
          title: "Positioning",
          canonicalText: "We help commercial teams.",
          category: "Definition",
        },
        {
          recordId: "recTrusted002",
          title: "Governance",
          canonicalText: "Humans keep judgement.",
          category: "Knowledge",
        },
      ],
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(toolUseResponse("get_trusted_truths", {})), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Here are the trusted rows.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Show trusted truths",
      history: [],
    });

    expect(result.proposals).toEqual([]);
    expect(result.reply).toBe("Here are the trusted rows.");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body ?? "{}")) as {
      messages: Array<{ content: Array<{ type: string; content?: string }> }>;
    };
    const toolResult = secondBody.messages
      .flatMap((message) => (Array.isArray(message.content) ? message.content : []))
      .find((block) => block.type === "tool_result");
    expect(toolResult?.content).toContain("recTrusted001");
    expect(toolResult?.content).toContain("Positioning");
  });

  it("queues propose_truth_edit to workshop-draft-truth with supersedes id", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            toolUseResponse("propose_truth_edit", {
              title: "Updated positioning",
              canonicalText: "Sharper claim.",
              supersedesTrustedTruthId: "recTrusted001",
              proposedCategory: "Definition",
            }),
          ),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Queued the edit.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Edit positioning",
      history: [],
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]).toMatchObject({
      toolName: "propose_truth_edit",
      title: "Updated positioning",
      destination: "workshop-draft-truth",
      payload: {
        supersedesTrustedTruthId: "recTrusted001",
        proposedCategory: "Definition",
      },
      status: "pending",
    });
  });

  it("queues route_intake_item to workshop-source-document", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            toolUseResponse("route_intake_item", {
              title: "Intake note",
              canonicalText: "File this as a source document.",
              target: "source_document",
            }),
          ),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Routed.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "File the intake",
      history: [],
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]).toMatchObject({
      toolName: "route_intake_item",
      destination: "workshop-source-document",
      payload: { target: "source_document" },
    });
  });

  it("stops after MAX_TOOL_ROUNDS even if the model keeps requesting tools", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockImplementation(async () =>
      new Response(JSON.stringify(toolUseResponse("get_trusted_truths", {})), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Keep reading the docket",
      history: [],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.proposals).toEqual([]);
  });

  it("enqueues child model calls when platform writes are on and rounds > 1", async () => {
    platformEnabledMock.mockReturnValue(true);
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(toolUseResponse("get_trusted_truths", {})), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(anthropicTextReply("Done after one tool round.")), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    await runCurationChat({
      brainSlug: "astrajax-chapter-1",
      sessionId: "sess-curate",
      message: "Platform-logged curation",
      history: [],
      platformHandle: "handle.signed",
      turnId: "turn-rounds-1",
    });

    expect(queueTurnMock).toHaveBeenCalledTimes(1);
    expect(queueTurnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        turnId: "turn-rounds-1",
        surface: "curation",
        callIndex: 0,
      }),
    );
    expect(queueChildMock).toHaveBeenCalledTimes(1);
    expect(queueChildMock).toHaveBeenCalledWith(
      expect.objectContaining({
        turnId: "turn-rounds-1",
        surface: "curation",
        callIndex: 1,
      }),
    );
    expect(logMock).not.toHaveBeenCalled();
  });
});
