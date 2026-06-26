import {
  CHAPTER1_CLIVE_GUARDRAILS,
  PAM_GUARDRAILS,
  WEBSITE_GUARDRAILS,
} from "./fallback-context";
import { formatContextForPrompt } from "./load-context";
import type { ChatMessage, ClivePersona, ContextBlock } from "./types";

export function buildSystemPrompt(
  blocks: ContextBlock[],
  options?: { persona?: ClivePersona; loopContext?: string },
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

  return `${guardrails}${loopSection}

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
