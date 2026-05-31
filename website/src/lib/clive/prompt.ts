import { WEBSITE_GUARDRAILS } from "./fallback-context";
import { formatContextForPrompt } from "./load-context";
import type { ChatMessage, ContextBlock } from "./types";

export function buildSystemPrompt(blocks: ContextBlock[]): string {
  return `${WEBSITE_GUARDRAILS}

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
