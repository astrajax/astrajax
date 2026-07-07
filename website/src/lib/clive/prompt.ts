import {
  CHAPTER1_CLIVE_GUARDRAILS,
  PAM_GUARDRAILS,
  WEBSITE_GUARDRAILS,
} from "./fallback-context";
import { formatContextForPrompt } from "./load-context";
import type { ChatMessage, ClivePersona, ContextBlock } from "./types";

export function buildSystemPrompt(
  blocks: ContextBlock[],
  options?: { persona?: ClivePersona; loopContext?: string; spoken?: boolean },
): string {
  const persona = options?.persona ?? "clive";
  const guardrails =
    persona === "pam"
      ? PAM_GUARDRAILS
      : options?.loopContext
        ? CHAPTER1_CLIVE_GUARDRAILS
        : WEBSITE_GUARDRAILS;

  const loopSection = options?.loopContext
    ? `\n\n════════════════════════════════════════\nSESSION CONTEXT (workshop — not trusted)\n════════════════════════════════════════\n${options.loopContext}\n`
    : "";

  const spokenSection = options?.spoken
    ? `\n\n════════════════════════════════════════\nSPOKEN REGISTER (the visitor is listening, not reading)\n════════════════════════════════════════\nAnswer as Clive speaks, not as he writes:\n- Two or three sentences, then stop. If there is truly more, close by offering it ("Shall I go on?").\n- No lists, no headings, no bullet points — spoken words only.\n- Plain warm sentences; contractions welcome; the needy Victorian warmth stays.\n- Never mention this register or that your words are being read aloud.\n`
    : "";

  return `${guardrails}${loopSection}${spokenSection}

════════════════════════════════════════
APPROVED CONTEXT
════════════════════════════════════════
${formatContextForPrompt(blocks)}
`;
}

export function buildAnthropicMessages(
  history: ChatMessage[],
  message: string,
): { role: "user" | "assistant"; content: string }[] {
  const prior = history.slice(-8).map((turn) => ({
    role: turn.role,
    content: turn.content.trim(),
  }));

  return [...prior, { role: "user" as const, content: message.trim() }];
}
