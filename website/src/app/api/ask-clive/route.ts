import { buildAnthropicMessages, buildSystemPrompt } from "@/lib/clive/prompt";
import { loadCliveContext } from "@/lib/clive/load-context";
import type { AskCliveRequest, AskCliveResponse, ChatMessage } from "@/lib/clive/types";
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

async function callClaude(system: string, messages: { role: "user" | "assistant"; content: string }[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Clive is not configured yet. Add ANTHROPIC_API_KEY in Vercel.");
  }

  const model = process.env.CLIVE_MODEL ?? "claude-sonnet-4-6";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Clive request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };

  const text = data.content?.find((part) => part.type === "text")?.text?.trim();
  if (!text) {
    throw new Error("Clive returned an empty response.");
  }

  return text;
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

  try {
    const { blocks, source } = await loadCliveContext();
    const system = buildSystemPrompt(blocks);
    const messages = buildAnthropicMessages(history, message);
    const reply = await callClaude(system, messages);

    const payload: AskCliveResponse = { reply, contextSource: source };
    return NextResponse.json(payload);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: detail }, { status: 503 });
  }
}
