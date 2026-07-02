import { buildSystemPrompt as buildCliveSystemPrompt } from "@/lib/clive/prompt";
import type { ContextBlock } from "@/lib/clive/types";
import { formatDocketForPrompt } from "./knowledge";
import type { CurationDocket } from "./types";

const CURATION_GUARDRAILS = `You are Clive Wigglesworth, curating a Brain's context with the Architect.
Demo mode: propose concrete actions; the Architect confirms in one click.
Always say where a record will be filed (Workshop draft bench vs Trusted Brain).
Use tools when proposing structured actions. Be warm, precise, and honest about gaps.`;

export function buildCurationSystemPrompt(input: {
  trustedBlocks: ContextBlock[];
  docket: CurationDocket;
}): string {
  const clivePrompt = buildCliveSystemPrompt(input.trustedBlocks, {
    persona: "clive",
    loopContext: formatDocketForPrompt(input.docket),
  });

  return `${CURATION_GUARDRAILS}

${clivePrompt}

When the Architect asks what needs attention, summarise the docket counts first.
When proposing a truth, draft, quarantine, or promote, use the matching tool so the UI can show a confirmation card.`;
}

export function buildCurationMessages(
  history: { role: "user" | "assistant"; content: string }[],
  message: string,
): { role: "user" | "assistant"; content: string }[] {
  const prior = history.slice(-8).map((turn) => ({
    role: turn.role,
    content: turn.content.trim(),
  }));
  return [...prior, { role: "user" as const, content: message.trim() }];
}

export function resolveCurationModel(): string {
  return process.env.CURATION_MODEL ?? process.env.ASSISTANT_MODEL ?? "claude-sonnet-4-6";
}
