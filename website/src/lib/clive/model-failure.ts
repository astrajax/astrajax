import type { ClivePersona } from "./types";

/**
 * Shown when a model call was genuinely attempted and failed.
 *
 * This is deliberately NOT a seeded reply. The seeded copy in
 * `chapter1-fallback` exists for the documented offline path only, where no
 * ANTHROPIC_API_KEY is configured. On a configured system a stored answer is
 * indistinguishable from a live one — especially while streaming — so the
 * character admits the failure instead of answering the question.
 */
const MODEL_FAILURE_NOTICE: Record<ClivePersona, string> = {
  clive:
    "I can't reach my reasoning right now — the line to my thinking is down, and I'd rather say so than invent something. Give me a moment and ask again.",
  pam:
    "I can't reach my reasoning right now, and I won't hand you a verdict I haven't actually formed. Give me a moment and ask again.",
};

export function getModelFailureNotice(persona: ClivePersona): string {
  return MODEL_FAILURE_NOTICE[persona] ?? MODEL_FAILURE_NOTICE.clive;
}
