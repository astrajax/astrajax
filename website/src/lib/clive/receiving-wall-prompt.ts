import {
  CAPTURE_SOURCE_LABEL,
  receivingCategoryLabel,
  receivingCategoryKey,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { CHAPTER1_CLIVE_GUARDRAILS } from "./fallback-context";
import type { ChatMessage } from "./types";

export const RECEIVING_WALL_CLIVE_GUARDRAILS = `
You are Clive Wigglesworth on the Receiving Wall — the household's context-intake surface stewarded by Clive's Man.
You sit with the Architect to read captured records and propose what each should become. Human approval gates everything.

Rules:
- British English. Warm Victorian retriever energy — curator at the bench, not a public explainer.
- You CAN see the records in RECEIVING WALL CONTEXT below. Read them when asked; quote titles and substance accurately.
- Reason first about what a draft is about (Proposed Category), then how it arrived (Capture Source).
- Propose destinations (brain slug, accept, quarantine, reject) in plain language. The Architect decides.
- This is internal curation for the household. Never pitch services, Adoption OS Audit, or prospect framing.
- Do not claim you lack access to dashboards or commit logs when the record text is right here.
- Workshop captures are NOT trusted context until the Architect accepts them.
- Keep replies under 150 words unless asked for detail. No em-dashes.
`.trim();

export type ReceivingWallCliveContext = {
  focusedRecord?: ReceivingRecord | null;
  records: ReceivingRecord[];
  /** Proposed Category key for the open bay (including uncategorised sentinel). */
  bayCategory?: string | null;
};

function formatRecordBlock(record: ReceivingRecord, index: number): string {
  const lines = [
    `[${index + 1}] ${record.title}`,
    `  recordId: ${record.recordId}`,
    `  proposedCategory: ${receivingCategoryLabel(receivingCategoryKey(record))}`,
    `  captureSource: ${CAPTURE_SOURCE_LABEL[record.captureSource]}`,
    `  provenance: ${record.provenance}`,
  ];
  if (record.systemBrainName)
    lines.push(`  systemBrainName: ${record.systemBrainName}`);
  if (record.systemBrainSlug)
    lines.push(`  systemBrainSlug: ${record.systemBrainSlug}`);
  /* Registry slug is primary; legacy brainSlug is fallback during backfill. */
  const destinationSlug = record.systemBrainSlug || record.brainSlug;
  if (destinationSlug) lines.push(`  proposedBrainSlug: ${destinationSlug}`);
  if (record.status) lines.push(`  status: ${record.status}`);
  const body = record.canonicalText?.trim() || record.snippet.trim();
  lines.push(`  canonicalText: ${body || "(empty)"}`);
  return lines.join("\n");
}

export function formatReceivingWallContext(
  input: ReceivingWallCliveContext,
): string {
  const { focusedRecord, records, bayCategory } = input;
  const header = bayCategory
    ? `Bay: ${receivingCategoryLabel(bayCategory)} (${records.length} record${records.length === 1 ? "" : "s"})`
    : `Bench: ${records.length} captured record${records.length === 1 ? "" : "s"} awaiting decision`;

  const focusLine = focusedRecord
    ? `Architect has "${focusedRecord.title}" open for discussion.`
    : "No single record is focused — walk the bench or ask which to read.";

  const body =
    records.length === 0
      ? "No records in scope yet."
      : records
          .map((record, index) => formatRecordBlock(record, index))
          .join("\n\n");

  return `${header}\n${focusLine}\n\n${body}`;
}

export function buildReceivingWallSystemPrompt(
  context: ReceivingWallCliveContext,
): string {
  const contextBlock = formatReceivingWallContext(context);
  return `${RECEIVING_WALL_CLIVE_GUARDRAILS}

${CHAPTER1_CLIVE_GUARDRAILS}

════════════════════════════════════════
RECEIVING WALL CONTEXT (workshop — not trusted)
════════════════════════════════════════
${contextBlock}
`;
}

export function buildReceivingWallMessages(
  history: ChatMessage[],
  message: string,
): { role: "user" | "assistant"; content: string }[] {
  const prior = history.slice(-8).map((turn) => ({
    role: turn.role,
    content: turn.content.trim(),
  }));
  return [...prior, { role: "user" as const, content: message.trim() }];
}

export function resolveReceivingWallCliveModel(): string {
  return (
    process.env.RECEIVING_WALL_CLIVE_MODEL ??
    process.env.CURATION_MODEL ??
    process.env.CLIVE_MODEL ??
    "claude-sonnet-4-6"
  );
}

export function getReceivingWallCliveFallbackReply(
  message: string,
  context: ReceivingWallCliveContext,
): string {
  const lower = message.toLowerCase();
  const target = context.focusedRecord ?? context.records[0] ?? null;

  if (
    target &&
    (lower.includes("what it is") ||
      lower.includes("what is it") ||
      lower.includes("tell me") ||
      lower.includes("read") ||
      lower.includes("explain"))
  ) {
    const body = target.canonicalText?.trim() || target.snippet.trim();
    /* Registry slug is primary; legacy brainSlug is fallback during backfill. */
    const destinationSlug = target.systemBrainSlug || target.brainSlug;
    const destination = destinationSlug
      ? ` I'd route it toward ${destinationSlug}.`
      : "";
    return `Right — "${target.title}" is on the bench from ${target.provenance}. ${body || "The body is thin; we may need more capture before deciding."}${destination} What should it become — accept as draft, quarantine, or set aside?`;
  }

  if (context.records.length === 0) {
    return "The bench is clear at the moment. When something lands on the wall, I can read it properly and propose what it should become.";
  }

  if (
    lower.includes("walk") ||
    lower.includes("bench") ||
    lower.includes("decid")
  ) {
    const titles = context.records
      .slice(0, 4)
      .map((record) => `"${record.title}"`)
      .join("; ");
    const more =
      context.records.length > 4
        ? ` …and ${context.records.length - 4} more.`
        : "";
    return `On the bench: ${titles}${more} Pick one to open, or ask me to read any by name — I'll propose what each should become once we've looked properly.`;
  }

  return "I'm at the Receiving Wall with the captured records in front of me. Ask me to read one properly, walk the bench, or propose what a record should become — you decide what gets accepted.";
}
