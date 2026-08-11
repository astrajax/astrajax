import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-model"),
}));

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("@/lib/clive/load-context", () => ({
  loadCliveContext: vi.fn(async () => ({
    blocks: [],
    source: "trusted",
    manifest: { recordIds: [], hashes: [] },
  })),
}));

vi.mock("@/lib/clive/prompt", () => ({
  buildSystemPrompt: vi.fn(() => "system"),
  buildAnthropicMessages: vi.fn(() => []),
}));

vi.mock("@/lib/brains/handlers/interaction-log", () => ({
  handleInteractionLog: vi.fn(async () => undefined),
}));

vi.mock("@/lib/platform-activity/config", () => ({
  platformActivityEventWritesEnabled: vi.fn(() => false),
}));

vi.mock("@/lib/platform-activity/server", () => ({
  queueTurnWithModelCall: vi.fn(async () => undefined),
  queueTurnWithoutModel: vi.fn(async () => undefined),
  readOptionalSessionHandle: vi.fn(() => null),
  readTurnId: vi.fn(() => "turn_test"),
}));

import { streamText } from "ai";
import { handleInteractionLog } from "@/lib/brains/handlers/interaction-log";
import { POST } from "./route";

const streamTextMock = vi.mocked(streamText);
const handleInteractionLogMock = vi.mocked(handleInteractionLog);

/** A seeded line from chapter1-fallback — must never appear on a failed call. */
const SEEDED_MARKER = "context stays human";

function askRequest(body: Record<string, unknown>): Request {
  return new Request("https://example.com/api/ask-clive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** streamText result whose stream fails the moment it is consumed. */
function failingResult(message: string) {
  return {
    textStream: {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<string>> {
            throw new Error(message);
          },
        };
      },
    },
    get text() {
      return Promise.reject(new Error(message));
    },
  } as unknown as ReturnType<typeof streamText>;
}

/** streamText result that yields chunks normally. */
function workingResult(chunks: string[]) {
  return {
    textStream: {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) yield chunk;
      },
    },
    get text() {
      return Promise.resolve(chunks.join(""));
    },
  } as unknown as ReturnType<typeof streamText>;
}

/** Yields one real chunk, then fails — simulates a mid-stream model error. */
function midStreamFailingResult(firstChunk: string, message: string) {
  return {
    textStream: {
      async *[Symbol.asyncIterator]() {
        yield firstChunk;
        throw new Error(message);
      },
    },
    get text() {
      return Promise.reject(new Error(message));
    },
  } as unknown as ReturnType<typeof streamText>;
}

beforeEach(() => {
  streamTextMock.mockReset();
  handleInteractionLogMock.mockClear();
  process.env.ANTHROPIC_API_KEY = "sk-test-key";
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

describe("Ask Clive honesty on model failure (key configured)", () => {
  it("does not stream a scripted reply when the streaming model call fails", async () => {
    streamTextMock.mockReturnValue(failingResult("rate limit exceeded"));

    const response = await POST(
      askRequest({ message: "What is a BRAIN?", stream: true }),
    );

    // A failed call must not look like a successful one.
    expect(response.status).toBe(503);
    expect(response.headers.get("X-Clive-Model-Error")).toBe("1");

    const text = await response.text();
    expect(text).not.toContain(SEEDED_MARKER);

    const payload = JSON.parse(text) as { error?: string };
    expect(payload.error).toMatch(/can't reach my reasoning/i);
  });

  it("does not return a scripted reply when the non-streaming call fails", async () => {
    streamTextMock.mockReturnValue(failingResult("connection reset"));

    const response = await POST(
      askRequest({ message: "What is a BRAIN?", stream: false }),
    );

    expect(response.status).toBe(503);

    const payload = (await response.json()) as { error?: string; reply?: string };
    expect(payload.reply).toBeUndefined();
    expect(payload.error).toMatch(/can't reach my reasoning/i);
    expect(JSON.stringify(payload)).not.toContain(SEEDED_MARKER);
  });

  it("admits the failure in Pam's voice without answering as Pam", async () => {
    streamTextMock.mockReturnValue(failingResult("timeout"));

    const response = await POST(
      askRequest({ message: "Challenge this", persona: "pam", stream: true }),
    );

    expect(response.status).toBe(503);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toMatch(/won't hand you a verdict/i);
    // Pam's seeded challenge copy must not be served as though she formed it.
    expect(payload.error).not.toMatch(/Missing evidence/i);
  });

  it("treats an empty model stream as a failure rather than an empty reply", async () => {
    streamTextMock.mockReturnValue(workingResult([]));

    const response = await POST(askRequest({ message: "Hello", stream: true }));

    expect(response.status).toBe(503);
  });

  it("treats a whitespace-only model stream as a failure", async () => {
    streamTextMock.mockReturnValue(workingResult(["   ", "\n\t", "  "]));

    const response = await POST(askRequest({ message: "Hello", stream: true }));

    expect(response.status).toBe(503);
    expect(response.headers.get("X-Clive-Model-Error")).toBe("1");
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toMatch(/can't reach my reasoning/i);
  });

  it("logs mid-stream failures as model-error rather than closing cleanly", async () => {
    streamTextMock.mockReturnValue(
      midStreamFailingResult("Splendid so far.", "socket hang up"),
    );

    const response = await POST(askRequest({ message: "Hello", stream: true }));

    // First chunk already committed the response; the body must still abort.
    expect(response.status).toBe(200);
    await expect(response.text()).rejects.toThrow(/socket hang up/i);

    expect(handleInteractionLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        assistantReply: expect.stringMatching(/can't reach my reasoning/i),
      }),
    );
  });

  it("still streams a genuine reply when the model succeeds", async () => {
    streamTextMock.mockReturnValue(workingResult(["Splendid. ", "Here is the answer."]));

    const response = await POST(askRequest({ message: "Hello", stream: true }));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Clive-Model-Error")).toBeNull();
    await expect(response.text()).resolves.toBe("Splendid. Here is the answer.");
  });
});

describe("Ask Clive offline path (no key) is unchanged", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("still serves the seeded reply as a 200 stream with the fallback header", async () => {
    const response = await POST(
      askRequest({ message: "Tell me anything", stream: true }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Clive-Fallback")).toBe("1");
    await expect(response.text()).resolves.toContain(SEEDED_MARKER);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("still returns the documented fallback:true JSON payload", async () => {
    const response = await POST(
      askRequest({ message: "Tell me anything", stream: false }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { fallback?: boolean; reply?: string };
    expect(payload.fallback).toBe(true);
    expect(payload.reply).toContain(SEEDED_MARKER);
  });
});

describe("Ask Clive logging", () => {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

  it("has one completion-owned log path for both streaming and non-stream responses", () => {
    expect(source.match(/await logReply\(\{/g) ?? []).toHaveLength(1);
    expect(source).not.toMatch(/const reply = \(await result\.text\)[\s\S]*await logReply\(/);
  });

  it("falls back to Workshop interaction logging when platform queueing fails", () => {
    // Regression lock for the silent-drop bug: platform prefer + catch must still
    // reach handleInteractionLog rather than returning success with no write.
    expect(source).toMatch(
      /falling back to Workshop log:[\s\S]*?await handleInteractionLog\(\{/,
    );
    expect(source.match(/await handleInteractionLog\(/g) ?? []).toHaveLength(2);
    expect(source).toContain("Ask Clive platform activity queue failed");
    expect(source).toContain("Ask Clive fallback platform queue failed");
  });

  it("only reaches for seeded replies on the no-key path", () => {
    // getSeededReply belongs to the documented offline path. If it reappears in
    // the catch block, a failed live call can answer the visitor with stored copy.
    expect(source.match(/getSeededReply\(/g) ?? []).toHaveLength(1);
    expect(source).not.toMatch(/catch \(error\)[\s\S]*getSeededReply\(/);
  });
});
