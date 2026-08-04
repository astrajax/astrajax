import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import {
  CAPTURE_SOURCE_LABEL,
  type CaptureSource,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { FALLBACK_CONTEXT } from "@/lib/clive/fallback-context";
import { buildAnthropicMessages, buildSystemPrompt } from "@/lib/clive/prompt";
import type { ChatMessage } from "@/lib/clive/types";
import { handleInteractionLog } from "./interaction-log";
import { CHAPTER1_BRAIN_SLUG } from "../airtable-ids";
import { platformActivityEventWritesEnabled } from "@/lib/platform-activity/config";
import { codeManifest, brainManifest } from "@/lib/platform-activity/manifest";
import {
  queueTurnWithModelCall,
  queueTurnWithoutModel,
} from "@/lib/platform-activity/server";

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_TURNS = 10;
const MAX_BAY_RECORDS = 8;
const MAX_CANONICAL_CHARS = 2400;

const RECEIVING_WALL_CURATION_PREAMBLE = `You are Clive Wigglesworth at the Receiving Wall — the household intake bench where captured draft context waits for a human decision.

Rules for this sitting:
- You are the curator, not the public website explainer. Do not pitch Adoption OS Audit, offers, or sales CTAs.
- Work from the OPEN RECORD and BAY RECORDS below. Quote their actual wording when asked what something is.
- Workshop drafts are not trusted truth. Never claim a record is approved or in the Trusted Brain unless its status already says so.
- Help the Architect decide what each draft should become (accept, refine, quarantine, or leave). Humans keep judgement.
- British English. Warm Victorian retriever energy. No em-dashes. Keep replies under 150 words unless asked for detail.`;

export type ReceivingWallCliveRecordPayload = {
  recordId: string;
  title: string;
  snippet?: string;
  canonicalText?: string;
  provenance?: string;
  captureSource?: CaptureSource | string;
  brainSlug?: string;
  status?: string;
};

export type ReceivingWallCliveResult = {
  reply: string;
  fallback?: boolean;
  contextSource: "model" | "fallback";
};

function trimText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function sanitiseRecord(
  raw: unknown,
): ReceivingWallCliveRecordPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const recordId = trimText(row.recordId, 64);
  const title = trimText(row.title, 200);
  if (!recordId || !title) return null;
  return {
    recordId,
    title,
    snippet: trimText(row.snippet, 400) || undefined,
    canonicalText: trimText(row.canonicalText, MAX_CANONICAL_CHARS) || undefined,
    provenance: trimText(row.provenance, 200) || undefined,
    captureSource: trimText(row.captureSource, 40) || undefined,
    brainSlug: trimText(row.brainSlug, 80) || undefined,
    status: trimText(row.status, 40) || undefined,
  };
}

export function sanitiseReceivingWallCliveHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is ChatMessage =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function formatRecordForPrompt(record: ReceivingWallCliveRecordPayload): string {
  const sourceLabel =
    record.captureSource && record.captureSource in CAPTURE_SOURCE_LABEL
      ? CAPTURE_SOURCE_LABEL[record.captureSource as CaptureSource]
      : record.captureSource || "unknown source";
  const body = record.canonicalText || record.snippet || "(no body text yet)";
  return [
    `Title: ${record.title}`,
    `Record ID: ${record.recordId}`,
    `Capture source: ${sourceLabel}`,
    record.provenance ? `Provenance: ${record.provenance}` : null,
    record.brainSlug ? `Proposed brain: ${record.brainSlug}` : null,
    record.status ? `Status: ${record.status}` : null,
    `Body:\n${body}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Builds the workshop session context the model sees for this wall sitting. */
export function buildReceivingWallCliveLoopContext(input: {
  openRecord?: ReceivingWallCliveRecordPayload | null;
  bayRecords?: ReceivingWallCliveRecordPayload[];
}): string {
  const open = input.openRecord ?? null;
  const bay = (input.bayRecords ?? []).slice(0, MAX_BAY_RECORDS);

  const openSection = open
    ? `OPEN RECORD (the Architect has this letter open — read it properly):\n${formatRecordForPrompt(open)}`
    : "OPEN RECORD: none — the Architect is at the bench. Ask which record to open, or walk the bay list below.";

  const baySection =
    bay.length > 0
      ? `BAY RECORDS (others waiting in this source):\n${bay
          .map((row, index) => {
            const line = `${index + 1}. ${row.title} [${row.recordId}]`;
            const meta = [row.status, row.provenance].filter(Boolean).join(" · ");
            return meta ? `${line} — ${meta}` : line;
          })
          .join("\n")}`
      : "BAY RECORDS: none listed for this sitting.";

  return `${RECEIVING_WALL_CURATION_PREAMBLE}

${openSection}

${baySection}`;
}

export function buildReceivingWallCliveFallback(input: {
  message: string;
  openRecord?: ReceivingWallCliveRecordPayload | null;
}): string {
  const open = input.openRecord;
  if (open) {
    const excerpt = (open.canonicalText || open.snippet || "").trim();
    const quoted = excerpt
      ? excerpt.length > 180
        ? `${excerpt.slice(0, 180)}…`
        : excerpt
      : "the letter has no body text yet";
    return `I have "${open.title}" open on the wall. From the letter itself: ${quoted} Shall we accept it as drafted, refine the wording, or quarantine it back to review?`;
  }
  return "The wall holds what the household has captured but not yet decided. Tell me which record to read, or ask me to walk the bench and propose what each should become.";
}

export function toCliveRecordPayload(
  record: ReceivingRecord,
): ReceivingWallCliveRecordPayload {
  return {
    recordId: record.recordId,
    title: record.title,
    snippet: record.snippet,
    canonicalText: record.canonicalText,
    provenance: record.provenance,
    captureSource: record.captureSource,
    brainSlug: record.brainSlug,
    status: record.status,
  };
}

export async function handleReceivingWallClive(input: {
  message: string;
  history?: unknown;
  sessionId?: string;
  openRecord?: unknown;
  bayRecords?: unknown;
  platformHandle?: string | null;
  turnId?: string;
}): Promise<ReceivingWallCliveResult> {
  const message = trimText(input.message, MAX_MESSAGE_LENGTH);
  if (!message) {
    throw new Error("Message is required.");
  }

  const history = sanitiseReceivingWallCliveHistory(input.history);
  const openRecord = sanitiseRecord(input.openRecord);
  const bayRecords = Array.isArray(input.bayRecords)
    ? input.bayRecords
        .map((row) => sanitiseRecord(row))
        .filter((row): row is ReceivingWallCliveRecordPayload => row !== null)
        .slice(0, MAX_BAY_RECORDS)
    : [];
  const sessionId =
    trimText(input.sessionId, 128) || `rw_${Date.now()}`;
  const brainSlug = openRecord?.brainSlug?.trim() || CHAPTER1_BRAIN_SLUG;
  const loopContext = buildReceivingWallCliveLoopContext({
    openRecord,
    bayRecords,
  });
  const recordIds = [
    ...new Set(
      [openRecord?.recordId, ...bayRecords.map((row) => row.recordId)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const reply = buildReceivingWallCliveFallback({ message, openRecord });
    await logFallback({
      sessionId,
      platformHandle: input.platformHandle ?? null,
      turnId: input.turnId ?? sessionId,
      brainSlug,
      message,
      reply,
      recordIds,
    });
    return { reply, fallback: true, contextSource: "fallback" };
  }

  try {
    const system = buildSystemPrompt(FALLBACK_CONTEXT, {
      persona: "clive",
      loopContext,
    });
    const messages = buildAnthropicMessages(history, message);
    const modelId =
      process.env.CURATION_MODEL ??
      process.env.CLIVE_MODEL ??
      "claude-sonnet-4-6";
    const startedAt = Date.now();
    const result = await generateText({
      model: anthropic(modelId),
      system,
      messages,
      maxOutputTokens: 400,
    });
    const reply = result.text.trim();
    if (!reply) {
      throw new Error("Clive returned an empty response.");
    }

    await logModelTurn({
      sessionId,
      platformHandle: input.platformHandle ?? null,
      turnId: input.turnId ?? sessionId,
      brainSlug,
      message,
      reply,
      recordIds,
      requestedModel: modelId,
      returnedModel: result.response.modelId,
      usage: result.usage,
      finishReason: result.finishReason,
      responseId: result.response.id,
      latencyMs: Date.now() - startedAt,
    });

    return { reply, contextSource: "model" };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.warn("Receiving Wall Clive failed, using curation fallback:", detail);
    const reply = buildReceivingWallCliveFallback({ message, openRecord });
    await logFallback({
      sessionId,
      platformHandle: input.platformHandle ?? null,
      turnId: input.turnId ?? sessionId,
      brainSlug,
      message,
      reply,
      recordIds,
    });
    return { reply, fallback: true, contextSource: "fallback" };
  }
}

async function logModelTurn(params: {
  sessionId: string;
  platformHandle: string | null;
  turnId: string;
  brainSlug: string;
  message: string;
  reply: string;
  recordIds: string[];
  requestedModel: string;
  returnedModel?: string;
  usage?: unknown;
  finishReason?: string;
  responseId?: string;
  latencyMs?: number;
}) {
  const preferPlatform =
    Boolean(params.platformHandle) && platformActivityEventWritesEnabled();

  if (preferPlatform) {
    try {
      await queueTurnWithModelCall({
        handle: params.platformHandle,
        turnId: params.turnId,
        surface: "receiving-wall",
        persona: "clive",
        brainSlug: params.brainSlug,
        userMessage: params.message,
        assistantReply: params.reply,
        manifest: brainManifest({
          recordIds: params.recordIds,
          source: "receiving-wall-clive",
          promptVersion: "receiving-wall-clive-v1",
        }),
        requestedModel: params.requestedModel,
        returnedModel: params.returnedModel,
        usage: params.usage,
        finishReason: params.finishReason,
        responseId: params.responseId,
        latencyMs: params.latencyMs,
      });
      return;
    } catch (logError) {
      console.warn(
        "Receiving Wall Clive platform activity queue failed; falling back to Workshop log:",
        logError,
      );
    }
  }

  await handleInteractionLog({
    sessionId: params.sessionId,
    persona: "clive",
    brainSlug: params.brainSlug,
    userMessage: params.message,
    assistantReply: params.reply,
    manifest: {
      recordIds: params.recordIds,
      hashes: [],
    },
    channel: "website",
  }).catch((logError) => {
    console.warn("Receiving Wall Clive Workshop interaction log failed:", logError);
  });
}

async function logFallback(params: {
  sessionId: string;
  platformHandle: string | null;
  turnId: string;
  brainSlug: string;
  message: string;
  reply: string;
  recordIds: string[];
}) {
  const preferPlatform =
    Boolean(params.platformHandle) && platformActivityEventWritesEnabled();

  if (preferPlatform) {
    try {
      await queueTurnWithoutModel({
        handle: params.platformHandle,
        turnId: params.turnId,
        surface: "receiving-wall",
        persona: "clive",
        brainSlug: params.brainSlug,
        userMessage: params.message,
        assistantReply: params.reply,
        manifest: codeManifest({
          source: "receiving-wall-clive-fallback",
          promptVersion: "receiving-wall-clive-fallback-v1",
        }),
        outcome: "fallback",
      });
      return;
    } catch (logError) {
      console.warn(
        "Receiving Wall Clive fallback platform queue failed; falling back to Workshop log:",
        logError,
      );
    }
  }

  await handleInteractionLog({
    sessionId: params.sessionId,
    persona: "clive",
    brainSlug: params.brainSlug,
    userMessage: params.message,
    assistantReply: params.reply,
    channel: "website",
  }).catch((logError) => {
    console.warn(
      "Receiving Wall Clive fallback Workshop interaction log failed:",
      logError,
    );
  });
}
