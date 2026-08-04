import {
  buildReceivingWallMessages,
  buildReceivingWallSystemPrompt,
  getReceivingWallCliveFallbackReply,
  resolveReceivingWallCliveModel,
  type ReceivingWallCliveContext,
} from "@/lib/clive/receiving-wall-prompt";
import type { ChatMessage } from "@/lib/clive/types";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import { platformActivityEventWritesEnabled } from "@/lib/platform-activity/config";
import { brainManifest } from "@/lib/platform-activity/manifest";
import {
  queueTurnWithModelCall,
  queueTurnWithoutModel,
} from "@/lib/platform-activity/server";
import { handleInteractionLog } from "./interaction-log";
import type { CaptureSource, ReceivingRecord } from "@/lib/receiving-wall";

const MAX_MESSAGE_LENGTH = 800;

export type ReceivingWallCliveRequest = {
  sessionId: string;
  message: string;
  history: ChatMessage[];
  focusedRecord?: ReceivingRecord | null;
  records?: ReceivingRecord[];
  baySource?: CaptureSource | null;
  actor?: string;
  platformHandle?: string | null;
  turnId?: string;
};

export type ReceivingWallCliveResponse = {
  reply: string;
  fallback?: boolean;
};

function sanitiseRecord(raw: unknown): ReceivingRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.recordId !== "string" || !item.recordId.trim()) return null;
  if (typeof item.title !== "string" || !item.title.trim()) return null;
  if (typeof item.snippet !== "string") return null;
  if (typeof item.provenance !== "string") return null;
  const captureSource = item.captureSource;
  if (
    captureSource !== "external" &&
    captureSource !== "user-guided" &&
    captureSource !== "chat"
  ) {
    return null;
  }
  return {
    recordId: item.recordId.trim(),
    title: item.title.trim(),
    snippet: item.snippet.trim(),
    provenance: item.provenance.trim(),
    captureSource,
    brainSlug: typeof item.brainSlug === "string" ? item.brainSlug.trim() : undefined,
    status: typeof item.status === "string" ? item.status.trim() : undefined,
    canonicalText:
      typeof item.canonicalText === "string" ? item.canonicalText.trim() : undefined,
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
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function sanitiseBaySource(raw: unknown): CaptureSource | null {
  if (raw === "external" || raw === "user-guided" || raw === "chat") return raw;
  return null;
}

function buildContext(input: ReceivingWallCliveRequest): ReceivingWallCliveContext {
  const records = (input.records ?? [])
    .map(sanitiseRecord)
    .filter((record): record is ReceivingRecord => record !== null);
  const focusedRecord = sanitiseRecord(input.focusedRecord ?? null);
  return {
    focusedRecord,
    records: records.length > 0 ? records : focusedRecord ? [focusedRecord] : [],
    baySource: sanitiseBaySource(input.baySource),
  };
}

async function callReceivingWallClive(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<{ reply: string; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const apiBase = (process.env.ANTHROPIC_API_BASE ?? "https://api.anthropic.com").replace(
    /\/+$/,
    "",
  );
  const model = resolveReceivingWallCliveModel();
  const response = await fetch(`${apiBase}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Receiving Wall Clive failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const reply =
    data.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!reply) {
    throw new Error("Receiving Wall Clive returned an empty response.");
  }

  return { reply, model };
}

export async function handleReceivingWallClive(
  input: ReceivingWallCliveRequest,
): Promise<ReceivingWallCliveResponse> {
  const message = input.message.trim();
  if (!message) throw new Error("message is required.");
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  const context = buildContext(input);
  const system = buildReceivingWallSystemPrompt(context);
  const messages = buildReceivingWallMessages(input.history, message);
  const recordIds = context.records.map((record) => record.recordId);
  const brainSlug = context.focusedRecord?.brainSlug ?? CHAPTER1_BRAIN_SLUG;
  const platformManifest = brainManifest({
    recordIds,
    source: "receiving-wall",
    promptVersion: "receiving-wall-clive-v1",
  });

  const logExchange = async (
    reply: string,
    options: { fallback: boolean; requestedModel?: string; returnedModel?: string },
  ) => {
    const preferPlatform =
      Boolean(input.platformHandle) && platformActivityEventWritesEnabled();

    if (preferPlatform) {
      try {
        if (options.fallback) {
          await queueTurnWithoutModel({
            handle: input.platformHandle ?? null,
            turnId: input.turnId ?? input.sessionId,
            surface: "receiving-wall",
            persona: "clive",
            brainSlug,
            userMessage: message,
            assistantReply: reply,
            manifest: platformManifest,
            outcome: "fallback",
          });
        } else {
          await queueTurnWithModelCall({
            handle: input.platformHandle ?? null,
            turnId: input.turnId ?? input.sessionId,
            surface: "receiving-wall",
            persona: "clive",
            brainSlug,
            userMessage: message,
            assistantReply: reply,
            manifest: platformManifest,
            requestedModel:
              options.requestedModel ?? resolveReceivingWallCliveModel(),
            returnedModel: options.returnedModel,
            fallback: false,
          });
        }
        return;
      } catch {
        // Fall through to Workshop interaction log.
      }
    }

    await handleInteractionLog({
      sessionId: input.sessionId,
      persona: "clive",
      brainSlug,
      userMessage: message,
      assistantReply: reply,
      channel: "website",
      manifest: {
        recordIds,
        hashes: [],
      },
    }).catch(() => undefined);
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    const reply = getReceivingWallCliveFallbackReply(message, context);
    await logExchange(reply, { fallback: true });
    return { reply, fallback: true };
  }

  try {
    const { reply, model } = await callReceivingWallClive(system, messages);
    await logExchange(reply, {
      fallback: false,
      requestedModel: model,
      returnedModel: model,
    });
    return { reply };
  } catch {
    const reply = getReceivingWallCliveFallbackReply(message, context);
    await logExchange(reply, { fallback: true });
    return { reply, fallback: true };
  }
}
