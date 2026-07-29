import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import {
  buildAnthropicMessages,
  buildSystemPrompt,
} from "@/lib/clive/prompt";
import { buildLoopContextSummary } from "@/lib/clive/loop-context";
import { loadCliveContext } from "@/lib/clive/load-context";
import {
  buildFallbackStream,
  getSeededReply,
} from "@/lib/clive/chapter1-fallback";
import type { AskCliveRequest, AskCliveResponse, ChatMessage } from "@/lib/clive/types";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import { LOOP_STEPS, type LoopStep } from "@/lib/aie-demo/types";
import { handleInteractionLog } from "@/lib/brains/handlers/interaction-log";
import { brainManifest, codeManifest } from "@/lib/platform-activity/manifest";
import {
  queueTurnWithModelCall,
  queueTurnWithoutModel,
  readOptionalSessionHandle,
  readTurnId,
} from "@/lib/platform-activity/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 10;

function sanitiseHistory(raw: unknown): ChatMessage[] {
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

function resolveSessionId(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 128);
  return `web_${Date.now()}`;
}

function wantsStream(request: Request, body: AskCliveRequest): boolean {
  if (body.stream === true) return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/plain") || accept.includes("text/event-stream");
}

async function logReply(params: {
  sessionId: string;
  platformHandle: string | null;
  turnId: string;
  persona: "clive" | "pam";
  message: string;
  reply: string;
  manifest: { recordIds: string[]; hashes: string[] };
  source: string;
  requestedModel: string;
  returnedModel?: string;
  usage?: unknown;
  finishReason?: string;
  responseId?: string;
  latencyMs?: number;
}) {
  const legacy = handleInteractionLog({
    sessionId: params.sessionId,
    persona: params.persona,
    brainSlug: CHAPTER1_BRAIN_SLUG,
    userMessage: params.message,
    assistantReply: params.reply,
    manifest: {
      recordIds: params.manifest.recordIds,
      hashes: params.manifest.hashes,
    },
    channel: "website",
  }).catch((logError) => {
    console.warn("Ask Clive legacy interaction log failed:", logError);
  });

  const platform = queueTurnWithModelCall({
    handle: params.platformHandle,
    turnId: params.turnId,
    surface: "ask-clive",
    persona: params.persona,
    brainSlug: CHAPTER1_BRAIN_SLUG,
    userMessage: params.message,
    assistantReply: params.reply,
    manifest: brainManifest({
      recordIds: params.manifest.recordIds,
      source: params.source,
      promptVersion: "ask-clive-v1",
    }),
    requestedModel: params.requestedModel,
    returnedModel: params.returnedModel,
    usage: params.usage,
    finishReason: params.finishReason,
    responseId: params.responseId,
    latencyMs: params.latencyMs,
  }).catch((logError) => {
    console.warn("Ask Clive platform activity queue failed:", logError);
  });

  await Promise.all([legacy, platform]);
}

function resolveBeat(raw: unknown): LoopStep | undefined {
  if (typeof raw !== "string") return undefined;
  const allSteps = [...LOOP_STEPS, "truth_approval"] as const;
  return (allSteps as readonly string[]).includes(raw) ? (raw as LoopStep) : undefined;
}

export async function POST(request: Request) {
  let body: AskCliveRequest;

  try {
    body = (await request.json()) as AskCliveRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const history = sanitiseHistory(body.history);
  const sessionId = resolveSessionId(body.sessionId);
  const platformHandle = readOptionalSessionHandle(request);
  const turnId = readTurnId(request);
  const persona = body.persona === "pam" ? "pam" : "clive";
  const beat = resolveBeat(body.beat);
  const spoken = body.spoken === true;
  const loopContext =
    typeof body.loopContext === "string" && body.loopContext.trim()
      ? body.loopContext.trim()
      : beat
        ? buildLoopContextSummary({ beat })
        : undefined;
  const stream = wantsStream(request, body);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const reply = getSeededReply(persona, message, beat ?? undefined);
    await queueTurnWithoutModel({
      handle: platformHandle,
      turnId,
      surface: "ask-clive",
      persona,
      brainSlug: CHAPTER1_BRAIN_SLUG,
      userMessage: message,
      assistantReply: reply,
      manifest: codeManifest({ source: "chapter1-fallback", promptVersion: "ask-clive-fallback-v1" }),
      outcome: "fallback",
    }).catch(() => undefined);
    if (stream) {
      return new Response(buildFallbackStream(reply), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Clive-Fallback": "1" },
      });
    }
    const payload: AskCliveResponse = {
      reply,
      contextSource: "fallback",
      interactionLogged: false,
      fallback: true,
    };
    return NextResponse.json(payload);
  }

  try {
    const { blocks, source, manifest } = await loadCliveContext();
    const system = buildSystemPrompt(blocks, { persona, loopContext, spoken });
    const messages = buildAnthropicMessages(history, message);
    const modelId = process.env.CLIVE_MODEL ?? "claude-sonnet-4-6";

    const startedAt = Date.now();
    const result = streamText({
      model: anthropic(modelId),
      system,
      messages,
      maxOutputTokens: spoken ? 220 : 400,
      onFinish: async ({ text, usage, finishReason, response }) => {
        if (text.trim()) {
          await logReply({
            sessionId,
            platformHandle,
            turnId,
            persona,
            message,
            reply: text.trim(),
            manifest,
            source,
            requestedModel: modelId,
            returnedModel: response.modelId,
            usage,
            finishReason,
            responseId: response.id,
            latencyMs: Date.now() - startedAt,
          });
        }
      },
    });

    if (stream) {
      return result.toTextStreamResponse({
        headers: {
          "X-Clive-Context-Source": source,
        },
      });
    }

    const reply = (await result.text).trim();
    if (!reply) {
      throw new Error("Clive returned an empty response.");
    }

    const payload: AskCliveResponse = {
      reply,
      contextSource: source,
      interactionLogged: true,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const reply = getSeededReply(persona, message, beat ?? undefined);
    await queueTurnWithoutModel({
      handle: platformHandle,
      turnId,
      surface: "ask-clive",
      persona,
      brainSlug: CHAPTER1_BRAIN_SLUG,
      userMessage: message,
      assistantReply: reply,
      manifest: codeManifest({ source: "chapter1-fallback", promptVersion: "ask-clive-fallback-v1" }),
      outcome: "fallback",
    }).catch(() => undefined);
    if (stream) {
      return new Response(buildFallbackStream(reply), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Clive-Fallback": "1" },
      });
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.warn("Ask Clive failed, using fallback:", detail);
    const payload: AskCliveResponse = {
      reply,
      contextSource: "fallback",
      interactionLogged: false,
      fallback: true,
    };
    return NextResponse.json(payload);
  }
}
