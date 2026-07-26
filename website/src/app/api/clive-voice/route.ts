// T1 provider adapter (OpenAI) per website/docs/clive-voice-t1-build-pack.md (D1).
// Swap provider by replacing only this file.
import { NextResponse } from "next/server";
import { createEnvelope } from "@/lib/platform-activity/envelope";
import { codeManifest } from "@/lib/platform-activity/manifest";
import {
  queuePlatformEnvelope,
  reservePlatformSequences,
} from "@/lib/platform-activity/session-service";
import { readOptionalSessionHandle, readTurnId } from "@/lib/platform-activity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_INSTRUCTIONS = "Warm, wistful Victorian gentleman; unhurried; gentle RP; a private reading voice by lamplight; slightly hopeful, as if glad of the company.";
const MAX_TEXT_LENGTH = 2000;

async function queueVoiceEvent(input: {
  handle: string | null;
  turnId: string;
  model: string;
  voice: string;
  outcome: string;
  providerRequestId?: string;
  processingMs?: string;
  contentLength?: string;
  latencyMs: number;
}) {
  if (!input.handle) return;
  const { session, sequences } = await reservePlatformSequences(input.handle, 1);
  await queuePlatformEnvelope(
    createEnvelope({
      session,
      sequence: sequences[0],
      eventId: `evt-platform-${session.publicSessionId}-voice-${input.turnId}`,
      eventType: "Voice",
      summary: "Clive voice synthesis",
      model: input.model,
      manifest: codeManifest({ source: "clive-voice", promptVersion: "clive-voice-t1" }),
      outcome: input.outcome,
      detail: {
        turnId: input.turnId,
        parentEventId: `evt-platform-${session.publicSessionId}-turn-${input.turnId}`,
        provider: "openai",
        voice: input.voice,
        providerRequestId: input.providerRequestId,
        processingMs: input.processingMs,
        contentLength: input.contentLength,
        latencyMs: input.latencyMs,
      },
    }),
  );
}

export async function POST(request: Request) {
  let body: { text?: unknown; persona?: unknown; turnId?: unknown };

  try {
    body = (await request.json()) as { text?: unknown; persona?: unknown; turnId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Text must be 2,000 characters or fewer." },
      { status: 400 },
    );
  }

  // persona reserved for future voices (Pam); v1 speaks only as Clive.
  const platformHandle = readOptionalSessionHandle(request);
  const turnId = readTurnId(request);
  const model = process.env.CLIVE_TTS_MODEL ?? "gpt-4o-mini-tts";
  const voice = process.env.CLIVE_TTS_VOICE ?? "fable";
  const startedAt = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Voice is resting." }, { status: 503 });
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        instructions: process.env.CLIVE_TTS_INSTRUCTIONS ?? DEFAULT_INSTRUCTIONS,
      }),
    });

    if (!upstream.ok) {
      console.warn(
        "Clive voice TTS failed:",
        upstream.status,
        await upstream.text().catch(() => ""),
      );
      await queueVoiceEvent({
        handle: platformHandle,
        turnId,
        model,
        voice,
        outcome: `failed_${upstream.status}`,
        providerRequestId: upstream.headers.get("x-request-id") ?? undefined,
        latencyMs: Date.now() - startedAt,
      }).catch(() => undefined);
      return NextResponse.json({ error: "Voice is resting." }, { status: 502 });
    }

    await queueVoiceEvent({
      handle: platformHandle,
      turnId,
      model,
      voice,
      outcome: "Completed",
      providerRequestId: upstream.headers.get("x-request-id") ?? undefined,
      processingMs: upstream.headers.get("openai-processing-ms") ?? undefined,
      contentLength: upstream.headers.get("content-length") ?? undefined,
      latencyMs: Date.now() - startedAt,
    }).catch(() => undefined);

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    console.warn("Clive voice request failed:", detail);
    return NextResponse.json({ error: "Voice is resting." }, { status: 502 });
  }
}
