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
import { getModelFailureNotice } from "@/lib/clive/model-failure";
import type { AskCliveRequest, AskCliveResponse, ChatMessage } from "@/lib/clive/types";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import { LOOP_STEPS, type LoopStep } from "@/lib/aie-demo/types";
import { handleInteractionLog } from "@/lib/brains/handlers/interaction-log";
import { platformActivityEventWritesEnabled } from "@/lib/platform-activity/config";
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
  const preferPlatform =
    Boolean(params.platformHandle) && platformActivityEventWritesEnabled();

  if (preferPlatform) {
    try {
      await queueTurnWithModelCall({
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
      });
      return;
    } catch (logError) {
      console.warn(
        "Ask Clive platform activity queue failed; falling back to Workshop log:",
        logError,
      );
    }
  }

  await handleInteractionLog({
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
    console.warn("Ask Clive Workshop interaction log failed:", logError);
  });
}

async function logFallbackExchange(params: {
  sessionId: string;
  platformHandle: string | null;
  turnId: string;
  persona: "clive" | "pam";
  message: string;
  reply: string;
  source: string;
}) {
  const preferPlatform =
    Boolean(params.platformHandle) && platformActivityEventWritesEnabled();

  if (preferPlatform) {
    try {
      await queueTurnWithoutModel({
        handle: params.platformHandle,
        turnId: params.turnId,
        surface: "ask-clive",
        persona: params.persona,
        brainSlug: CHAPTER1_BRAIN_SLUG,
        userMessage: params.message,
        assistantReply: params.reply,
        manifest: codeManifest({
          source: params.source,
          promptVersion: "ask-clive-fallback-v1",
        }),
        outcome: "fallback",
      });
      return;
    } catch (logError) {
      console.warn(
        "Ask Clive fallback platform queue failed; falling back to Workshop log:",
        logError,
      );
    }
  }

  await handleInteractionLog({
    sessionId: params.sessionId,
    persona: params.persona,
    brainSlug: CHAPTER1_BRAIN_SLUG,
    userMessage: params.message,
    assistantReply: params.reply,
    channel: "website",
  }).catch((logError) => {
    console.warn("Ask Clive fallback Workshop log failed:", logError);
  });
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
    await logFallbackExchange({
      sessionId,
      platformHandle,
      turnId,
      persona,
      message,
      reply,
      source: "chapter1-fallback",
    });
    if (stream) {
      return new Response(buildFallbackStream(reply), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Clive-Fallback": "1" },
      });
    }
    const payload: AskCliveResponse = {
      reply,
      contextSource: "fallback",
      interactionLogged: true,
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
    // Mid-stream aborts log via logFallbackExchange; this flag (plus the
    // finishReason check below) keeps onFinish from also writing a partial
    // success reply for the same turn.
    let streamFailureLogged = false;
    const result = streamText({
      model: anthropic(modelId),
      system,
      messages,
      maxOutputTokens: spoken ? 220 : 400,
      onFinish: async ({ text, usage, finishReason, response }) => {
        if (streamFailureLogged || finishReason === "error") {
          return;
        }
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
      // Pull the first non-empty chunk here, inside the try, before committing
      // to a 200. streamText() does not reject on connect-time failures (bad
      // key, bad model id, rate limit) — those surface when the stream is
      // consumed. Whitespace-only output is treated like an empty stream so it
      // matches the non-streaming trim() guard below. If we handed the raw
      // stream straight to the client, a failed call would arrive as an empty
      // 200 the visitor cannot tell from a real reply.
      const iterator = result.textStream[Symbol.asyncIterator]();
      let firstValue = "";
      for (;;) {
        const first = await iterator.next();
        if (first.done) {
          throw new Error("Clive returned an empty response.");
        }
        firstValue = typeof first.value === "string" ? first.value : "";
        if (firstValue.trim()) break;
      }

      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(firstValue));
            for (;;) {
              const next = await iterator.next();
              if (next.done) break;
              if (next.value) controller.enqueue(encoder.encode(next.value));
            }
            controller.close();
          } catch (streamError) {
            // Headers are already 200, so this cannot re-enter the route catch.
            // Still record the failure with the same model-error source, then
            // break the body so the client does not treat a truncation as a
            // complete answer.
            streamFailureLogged = true;
            const notice = getModelFailureNotice(persona);
            await logFallbackExchange({
              sessionId,
              platformHandle,
              turnId,
              persona,
              message,
              reply: notice,
              source: "model-error",
            });
            controller.error(streamError);
          }
        },
      });

      return new Response(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
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
    // A key is configured and the call was genuinely attempted, so this is a
    // real failure — not the documented offline path above. Serving a seeded
    // reply here would answer the visitor's question with stored copy that
    // streams exactly like a live answer. Clive admits the failure instead.
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.warn("Ask Clive model call failed:", detail);

    const notice = getModelFailureNotice(persona);
    await logFallbackExchange({
      sessionId,
      platformHandle,
      turnId,
      persona,
      message,
      reply: notice,
      source: "model-error",
    });

    // Non-2xx for both streaming and JSON callers: the client surfaces this as
    // a visible failure with a retry, and no assistant turn enters the
    // transcript. A 200 with a header was readable by the browser and
    // invisible to the person watching.
    return NextResponse.json(
      { error: notice, contextSource: "error", interactionLogged: false },
      { status: 503, headers: { "X-Clive-Model-Error": "1" } },
    );
  }
}
