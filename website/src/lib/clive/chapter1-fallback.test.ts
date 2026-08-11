import { describe, expect, it } from "vitest";
import {
  appendAssistantMessage,
  buildFallbackStream,
  CHAPTER1_CLIVE_GREETING,
  getSeededReply,
} from "./chapter1-fallback";

async function readStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged);
}

describe("getSeededReply — offline Ask Clive beat/keyword routing", () => {
  it("routes Clive by explicit beat before keyword heuristics", () => {
    expect(getSeededReply("clive", "anything", "welcome")).toMatch(/structure, agents, and a paper trail/i);
    expect(getSeededReply("clive", "anything", "context_importance")).toMatch(/context bloat/i);
    expect(getSeededReply("clive", "anything", "brains_intro")).toMatch(/Workshop drafts first/i);
    expect(getSeededReply("clive", "anything", "doc_handoff")).toMatch(/Doc has filed/i);
  });

  it("keeps welcome/context keyword matching off when a beat is already set", () => {
    // Without a beat, "architect"/"context" steer the reply; with an unrelated beat they must not.
    expect(getSeededReply("clive", "I am an architect", undefined)).toMatch(/structure, agents/i);
    expect(getSeededReply("clive", "tell me about context", undefined)).toMatch(/context bloat/i);

    const withBeat = getSeededReply("clive", "I am an architect of context systems", "brains_intro");
    expect(withBeat).toMatch(/Workshop drafts first/i);
    expect(withBeat).not.toMatch(/structure, agents/i);
  });

  it("maps profile/chair and draft/approve keywords for Clive", () => {
    expect(getSeededReply("clive", "update my profile", undefined)).toMatch(/adapt my pace/i);
    expect(getSeededReply("clive", "pull up a chair", undefined)).toMatch(/adapt my pace/i);
    expect(getSeededReply("clive", "please draft this", undefined)).toMatch(/workshop until you approve/i);
    expect(getSeededReply("clive", "I approve", undefined)).toMatch(/decision is yours/i);
  });

  it("uses Pam challenge copy for pam_challenge and truth_approval beats", () => {
    expect(getSeededReply("pam", "hello", "pam_challenge")).toMatch(/Missing evidence/i);
    expect(getSeededReply("pam", "challenge this assumption", undefined)).toMatch(/Missing evidence/i);
    // Architect journal path: Clive persona still surfaces Pam's challenge copy on that beat.
    expect(getSeededReply("clive", "ready", "truth_approval")).toMatch(/Missing evidence/i);
    expect(getSeededReply("pam", "generic question", undefined)).toMatch(/strongest part/i);
  });

  it("falls back to the default Clive reply when nothing matches", () => {
    expect(getSeededReply("clive", "hello there", undefined)).toMatch(/context stays human/i);
    expect(getSeededReply("clive", "hello there")).toContain("you decide");
  });
});

describe("buildFallbackStream / appendAssistantMessage", () => {
  it("streams the seeded reply as UTF-8 and closes", async () => {
    const reply = CHAPTER1_CLIVE_GREETING;
    await expect(readStreamText(buildFallbackStream(reply))).resolves.toBe(reply);
  });

  it("appends an assistant message without mutating the prior array", () => {
    const prior = [{ role: "user" as const, content: "hi" }];
    const next = appendAssistantMessage(prior, "hello");
    expect(next).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
    expect(prior).toHaveLength(1);
  });
});
