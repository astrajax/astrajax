// T1 provider adapter (OpenAI) per website/docs/clive-voice-t1-build-pack.md (D1).
// Swap provider by replacing only this file.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_INSTRUCTIONS = "Warm, wistful Victorian gentleman; unhurried; gentle RP; a private reading voice by lamplight; slightly hopeful, as if glad of the company.";
const MAX_TEXT_LENGTH = 2000;

export async function POST(request: Request) {
  let body: { text?: unknown; persona?: unknown };

  try {
    body = (await request.json()) as { text?: unknown; persona?: unknown };
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
        model: process.env.CLIVE_TTS_MODEL ?? "gpt-4o-mini-tts",
        voice: process.env.CLIVE_TTS_VOICE ?? "fable",
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
      return NextResponse.json({ error: "Voice is resting." }, { status: 502 });
    }

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
