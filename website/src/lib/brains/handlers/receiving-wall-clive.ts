import {
  buildReceivingWallMessages,
  buildReceivingWallSystemPrompt,
  getReceivingWallCliveFallbackReply,
  resolveReceivingWallCliveModel,
  type ReceivingWallCliveContext,
} from "@/lib/clive/receiving-wall-prompt";
import type { ChatMessage } from "@/lib/clive/types";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import { handleInteractionLog } from "./interaction-log";
import type { ReceivingRecord } from "@/lib/receiving-wall";

const MAX_MESSAGE_LENGTH = 800;

export type ReceivingWallCliveRequest = {
  sessionId: string;
  message: string;
  history: ChatMessage[];
  focusedRecord?: ReceivingRecord | null;
  records?: ReceivingRecord[];
  /** Proposed Category key for the open bay. */
  bayCategory?: string | null;
  actor?: string;
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
  const category =
    typeof item.category === "string" && item.category.trim()
      ? item.category.trim()
      : undefined;
  return {
    recordId: item.recordId.trim(),
    title: item.title.trim(),
    snippet: item.snippet.trim(),
    provenance: item.provenance.trim(),
    captureSource,
    category,
    systemBrainName:
      typeof item.systemBrainName === "string"
        ? item.systemBrainName.trim()
        : undefined,
    systemBrainSlug:
      typeof item.systemBrainSlug === "string"
        ? item.systemBrainSlug.trim()
        : undefined,
    brainSlug:
      typeof item.brainSlug === "string" ? item.brainSlug.trim() : undefined,
    status: typeof item.status === "string" ? item.status.trim() : undefined,
    canonicalText:
      typeof item.canonicalText === "string"
        ? item.canonicalText.trim()
        : undefined,
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

function buildContext(
  input: ReceivingWallCliveRequest,
): ReceivingWallCliveContext {
  const records = (input.records ?? [])
    .map(sanitiseRecord)
    .filter((record): record is ReceivingRecord => record !== null);
  const focusedRecord = sanitiseRecord(input.focusedRecord ?? null);
  const bayCategory =
    typeof input.bayCategory === "string" && input.bayCategory.trim()
      ? input.bayCategory.trim()
      : null;
  return {
    focusedRecord,
    records:
      records.length > 0 ? records : focusedRecord ? [focusedRecord] : [],
    bayCategory,
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

  const apiBase = (
    process.env.ANTHROPIC_API_BASE ?? "https://api.anthropic.com"
  ).replace(/\/+$/, "");
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
    throw new Error(
      `Receiving Wall Clive failed (${response.status}): ${detail.slice(0, 200)}`,
    );
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
    throw new Error(
      `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    );
  }

  const context = buildContext(input);
  const system = buildReceivingWallSystemPrompt(context);
  const messages = buildReceivingWallMessages(input.history, message);
  const recordIds = context.records.map((record) => record.recordId);

  const logExchange = async (reply: string, fallback: boolean) => {
    await handleInteractionLog({
      sessionId: input.sessionId,
      persona: "clive",
      brainSlug:
        context.focusedRecord?.systemBrainSlug ||
        context.focusedRecord?.brainSlug ||
        CHAPTER1_BRAIN_SLUG,
      userMessage: message,
      assistantReply: reply,
      channel: "website",
      manifest: {
        recordIds,
        hashes: [],
      },
    }).catch(() => undefined);
    void fallback;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    const reply = getReceivingWallCliveFallbackReply(message, context);
    await logExchange(reply, true);
    return { reply, fallback: true };
  }

  try {
    const { reply } = await callReceivingWallClive(system, messages);
    await logExchange(reply, false);
    return { reply };
  } catch {
    const reply = getReceivingWallCliveFallbackReply(message, context);
    await logExchange(reply, true);
    return { reply, fallback: true };
  }
}
