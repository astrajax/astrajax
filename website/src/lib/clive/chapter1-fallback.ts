import type { ChatMessage } from "./types";

export type ClivePersona = "clive" | "pam";

export const CHAPTER1_CLIVE_GREETING =
  "Before I calibrate pace and tone, I need a few things from you — typed answers, not a multiple-choice quiz. First: what should I call you?";

export const CHAPTER1_PAM_GREETING =
  "Better now than never. I've read the draft. Show me the assumption everyone has become far too comfortable with.";

const CLIVE_FALLBACK_REPLIES: Record<string, string> = {
  default:
    "Splendid question. The important part is this: context stays human. I can help structure it, Pam can challenge it, and Doc can file it — but you decide what becomes true.",
  welcome:
    "You know the work. AstraJax gives you structure, agents, and a paper trail; it does not take ownership of your context away from you.",
  context:
    "We start with a function or focused startup scope because context bloat makes agents vague. Specific ownership makes answers sharper and safer.",
  brains:
    "A BRAIN is governed context: Workshop drafts first, Trusted Brain after human approval. It is structure, memory, and restraint in one place.",
  profile:
    "Noted. I'll adapt my pace from what you told me — plain language where you need it, sharper where you're already expert. Ready to build the business brain?",
  draft:
    "I've drafted a business brain brief from our conversation. It stays in the workshop until you approve what becomes trusted.",
  approve:
    "Pam has had her say. The decision is yours — what becomes trusted context is never my call.",
  doc:
    "Doc has filed the approved brief. The change is logged; workshop drafts are quarantined. Your brain is growing up.",
};

const PAM_FALLBACK_REPLIES: Record<string, string> = {
  default:
    "The strongest part is that you're starting from messy real sources — honest, not a weakness. The weakest assumption is that people will trust agent answers before they see where approved snippets came from.",
  challenge:
    "Missing evidence: no signed-off guardrail text in trusted context yet — only workshop drafts. Rabbit-hole risk: building analytics before the first approved records exist.",
};

export function getSeededReply(
  persona: ClivePersona,
  message: string,
  beat?: string,
): string {
  const lower = message.toLowerCase();
  const hasBeat = Boolean(beat);

  if (persona === "pam") {
    if (beat === "pam_challenge" || lower.includes("challenge")) {
      return PAM_FALLBACK_REPLIES.challenge;
    }
    return PAM_FALLBACK_REPLIES.default;
  }

  if (beat === "user_brain" || lower.includes("profile") || lower.includes("chair")) {
    return CLIVE_FALLBACK_REPLIES.profile;
  }
  if (beat === "welcome" || (!hasBeat && lower.includes("architect"))) {
    return CLIVE_FALLBACK_REPLIES.welcome;
  }
  if (beat === "context_importance" || (!hasBeat && lower.includes("context"))) {
    return CLIVE_FALLBACK_REPLIES.context;
  }
  if (beat === "brains_intro") {
    return CLIVE_FALLBACK_REPLIES.brains;
  }
  if (beat === "truth_approval") {
    return PAM_FALLBACK_REPLIES.challenge;
  }
  if (beat === "business_brain" || lower.includes("draft") || lower.includes("brain")) {
    return CLIVE_FALLBACK_REPLIES.draft;
  }
  if (beat === "human_decision" || lower.includes("approve")) {
    return CLIVE_FALLBACK_REPLIES.approve;
  }
  if (beat === "doc_handoff" || lower.includes("doc")) {
    return CLIVE_FALLBACK_REPLIES.doc;
  }

  return CLIVE_FALLBACK_REPLIES.default;
}

export function buildFallbackStream(reply: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(reply));
      controller.close();
    },
  });
}

export function appendAssistantMessage(
  messages: ChatMessage[],
  content: string,
): ChatMessage[] {
  return [...messages, { role: "assistant", content }];
}
