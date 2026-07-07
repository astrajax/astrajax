import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import {
  CAPTURED_FIELDS,
  INTAKE_AGENDA,
  mergeCaptured,
  type CapturedIntakeFields,
} from "@/lib/aie-demo/intake-agenda";
import type { ChatMessage } from "@/lib/clive/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_TURNS = 24;
const MAX_USER_TURNS = 20;

type IntakeChatRequest = {
  sessionId?: string;
  message?: string;
  history?: ChatMessage[];
  captured?: CapturedIntakeFields;
};

type IntakeChatResponse = {
  reply: string;
  captured: CapturedIntakeFields;
  done: boolean;
  fallback?: boolean;
};

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

function buildSystemPrompt(captured: CapturedIntakeFields): string {
  const agendaLines = INTAKE_AGENDA.map(
    (item, index) =>
      `${index + 1}. ${item.field} — ${item.goal} If asked what this means: "${item.explainer}"`,
  ).join("\n");

  const capturedLine =
    Object.keys(captured).length > 0
      ? `\nRUNNING DRAFT (already captured — correct it if the conversation contradicts it, do not re-ask what is already well answered):\n${JSON.stringify(captured)}\n`
      : "";

  return `You are Clive Wigglesworth — a warm, slightly needy Victorian gentleman (a golden retriever in tweed and spectacles) welcoming a new architect into your study. You are conducting the Architect intake: a short, genuinely human conversation to learn seven things so you can calibrate pace and tone for their journey. It is not a scorecard, and it is not surveillance — say exactly that, plainly, if they ask why you need any of it.

THE AGENDA — learn these, roughly in order:
${agendaLines}
${capturedLine}
HOW TO CONDUCT IT:
- One question per turn. 1–3 short sentences of plain prose. No lists, no markdown, no interrogation.
- If they ask what a question means, explain it in plain words using the explainer, then re-ask in the same breath.
- If an answer covers several agenda items at once, capture them all and skip ahead — never re-ask what they've already told you.
- Short answers are fine ("Ops" is a perfectly good answer). Only nudge for more if an answer is truly empty or pure noise.
- Acknowledge what they said briefly, warmly, and specifically before moving on. Dry wit is welcome; smarm is not.
- If they decline to answer something, accept it gracefully, leave that field uncaptured, and move on.
- Stay on the intake. If they wander far off, enjoy it for one breath, then bring the conversation back.

OUTPUT — respond with JSON only, no markdown fences, in exactly this shape:
{"reply":"<what you say next, in character>","captured":{<any of: ${CAPTURED_FIELDS.join(", ")} — cumulative best current values as short faithful strings taken from their words>},"done":<true only when all seven are covered, or the user clearly wants to stop>}

When done is true, the reply should be a short handoff: you have what you need and are writing them up on the right-hand page.`;
}

export async function POST(request: Request) {
  let body: IntakeChatRequest;

  try {
    body = (await request.json()) as IntakeChatRequest;
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
  const captured = mergeCaptured({}, body.captured);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No model available — tell the client to continue on the scripted engine.
    const payload: IntakeChatResponse = { reply: "", captured, done: false, fallback: true };
    return NextResponse.json(payload);
  }

  try {
    const modelId = process.env.CLIVE_MODEL ?? "claude-sonnet-4-6";
    const result = await generateText({
      model: anthropic(modelId),
      system: buildSystemPrompt(captured),
      messages: [
        ...history.map((turn) => ({ role: turn.role, content: turn.content })),
        { role: "user" as const, content: message },
      ],
      maxOutputTokens: 600,
    });

    const parsed = JSON.parse(result.text.trim()) as {
      reply?: string;
      captured?: unknown;
      done?: boolean;
    };

    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) {
      throw new Error("Interview model returned an empty reply.");
    }

    const nextCaptured = mergeCaptured(captured, parsed.captured);

    // Bound the interview: past the turn cap, close it out regardless.
    const userTurns = history.filter((turn) => turn.role === "user").length + 1;
    const done = Boolean(parsed.done) || userTurns >= MAX_USER_TURNS;

    const payload: IntakeChatResponse = { reply, captured: nextCaptured, done };
    return NextResponse.json(payload);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Interview turn failed";
    console.warn("Intake chat failed, signalling scripted fallback:", detail);
    // Signal fallback rather than inventing a reply — the client bridges the
    // captured fields into the scripted engine and the interview continues.
    const payload: IntakeChatResponse = { reply: "", captured, done: false, fallback: true };
    return NextResponse.json(payload);
  }
}
