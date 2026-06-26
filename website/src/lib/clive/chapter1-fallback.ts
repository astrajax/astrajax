import type { ChatMessage } from "./types";

export type ClivePersona = "clive" | "pam";

export const CHAPTER1_CLIVE_GREETING =
  "Good — you've found the chair. Before we map the business brain, tell me who you are in this room: commercial expert, team leader, or systems architect?";

export const CHAPTER1_PAM_GREETING =
  "Better now than never. I've read the draft. Show me the assumption everyone has become far too comfortable with.";

const CLIVE_FALLBACK_REPLIES: Record<string, string> = {
  default:
    "Splendid question. At Seedling maturity we work from workshop drafts only — nothing becomes trusted until you approve it. Shall we map who sits in the chair first?",
  profile:
    "Noted. I'll adapt my pace to your profile — plain language where you need it, sharper where you're already expert. Ready to build the business brain?",
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

  if (persona === "pam") {
    if (beat === "pam_challenge" || lower.includes("challenge")) {
      return PAM_FALLBACK_REPLIES.challenge;
    }
    return PAM_FALLBACK_REPLIES.default;
  }

  if (beat === "user_brain" || lower.includes("profile") || lower.includes("chair")) {
    return CLIVE_FALLBACK_REPLIES.profile;
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
