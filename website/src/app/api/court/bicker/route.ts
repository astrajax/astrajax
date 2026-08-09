import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  extractJsonFromText,
  filterSeatedBickerTurns,
  isOpeningFlurry,
  parseAttendees,
  seedBickerRotation,
} from "@/lib/platform/court-bicker";
import { COURT_CAST_PERSONAS, SHARED_COURT_RULES } from "@/lib/platform/court-cast";
import { codeManifest } from "@/lib/platform-activity/manifest";
import {
  queueChildModelCall,
  queueTurnWithModelCall,
  queueTurnWithoutModel,
  readOptionalSessionHandle,
  readTurnId,
} from "@/lib/platform-activity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const {
    title,
    context,
    stakes,
    transcript,
    userMessage,
    attendees: attendeesRaw,
    callIndex: callIndexRaw,
    openingFlurry,
  } = await request.json();

  if (typeof title !== "string" || title.length === 0 || title.length > 500) {
    return Response.json(
      { error: "Invalid title" },
      { status: 400 }
    );
  }
  if (
    typeof context !== "string" ||
    context.length === 0 ||
    context.length > 500
  ) {
    return Response.json(
      { error: "Invalid context" },
      { status: 400 }
    );
  }
  if (typeof stakes !== "string" || stakes.length === 0 || stakes.length > 500) {
    return Response.json(
      { error: "Invalid stakes" },
      { status: 400 }
    );
  }

  if (!Array.isArray(transcript)) {
    return Response.json(
      { error: "Invalid transcript" },
      { status: 400 }
    );
  }

  const attendees = parseAttendees(attendeesRaw);

  const kept = transcript.slice(-14);
  const truncatedTranscript = kept
    .map((turn: { roleId: string; line: string }) => {
      const safeLine = String(turn.line || "").substring(0, 300);
      return `${turn.roleId}: ${safeLine}`;
    })
    .join("\n");

  const userMsg = userMessage ? String(userMessage).substring(0, 400) : "";
  const platformHandle = readOptionalSessionHandle(request);
  const turnId = readTurnId(request);
  const callIndex =
    typeof callIndexRaw === "number" && Number.isInteger(callIndexRaw) ? callIndexRaw : 5;
  const manifest = codeManifest({ source: "court-personas", promptVersion: "court-bicker-v2" });

  const opening = isOpeningFlurry(openingFlurry, transcript.length, callIndex);
  const turnBatch = opening ? "6 to 10" : "4 to 5";

  const matter = `Title: ${title}\n\nContext: ${context}\n\nStakes: ${stakes}`;
  const prompt = userMsg
    ? `${matter}\n\nRecent bench discussion:\n${truncatedTranscript}\n\nThe petitioner says: "${userMsg}"\n\nRespond with the next ${turnBatch} short bench turns.`
    : `${matter}\n\nRecent bench discussion:\n${truncatedTranscript}\n\nContinue the squabble with ${turnBatch} more short turns — a lively back-and-forth, not a tidy summary.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.COURT_MODEL || "claude-haiku-4-5-20251001";

  if (!apiKey) {
    const turns = seedBickerRotation(transcript.length, attendees, opening);
    if (userMsg) {
      await queueTurnWithoutModel({
        handle: platformHandle,
        turnId,
        surface: "court-bicker",
        persona: "bench",
        brainSlug: "court",
        userMessage: userMsg,
        assistantReply: turns.map((turn) => `${turn.roleId}: ${turn.line}`).join("; "),
        manifest,
        outcome: "fallback",
      }).catch(() => undefined);
    }
    return Response.json({ turns });
  }

  const personaBlock = [...attendees, "judge" as const]
    .map((id) => COURT_CAST_PERSONAS[id])
    .join("\n");
  const roleIdList = [...attendees, "judge"].join("|");

  const startedAt = Date.now();
  try {
    const response = await generateText({
      model: anthropic(model),
      system: `${personaBlock}

${SHARED_COURT_RULES}

Only these bench members are seated this session: ${attendees.join(", ")} (plus the judge). No other cast member is present; never speak for an absent colleague. Continue the squabble between the seated bench members about the matter. Produce the next ${turnBatch} short turns as JSON {"turns":[{"roleId":"${roleIdList}","line":"..."}]}. Each line under 35 words. They bicker—interrupt, needle each other by name, disagree in character. They never conclude or vote. The judge speaks at most rarely and only to note the human decides.${userMsg ? ' If the transcript ends with a turn from the petitioner, the bench must respond to them directly (address them as "the petitioner" or by their words), at least one turn doing so.' : ""}`,
      prompt,
      maxOutputTokens: opening ? 750 : 450,
      temperature: 1,
    });

    const parsed = extractJsonFromText(response.text);
    const turns = filterSeatedBickerTurns(parsed.turns, attendees);

    const telemetry = {
      handle: platformHandle,
      turnId,
      surface: "court-bicker",
      manifest,
      requestedModel: model,
      returnedModel: response.response.modelId,
      usage: response.usage,
      finishReason: response.finishReason,
      responseId: response.response.id,
      latencyMs: Date.now() - startedAt,
    };
    if (userMsg) {
      await queueTurnWithModelCall({
        ...telemetry,
        persona: "bench",
        brainSlug: "court",
        userMessage: userMsg,
        assistantReply: turns.map((turn) => `${turn.roleId}: ${turn.line}`).join("; "),
        callIndex,
      }).catch(() => undefined);
    } else {
      await queueChildModelCall({ ...telemetry, callIndex }).catch(() => undefined);
    }
    return Response.json({ turns });
  } catch {
    const turns = seedBickerRotation(transcript.length, attendees, opening);
    if (userMsg) {
      await queueTurnWithoutModel({
        handle: platformHandle,
        turnId,
        surface: "court-bicker",
        persona: "bench",
        brainSlug: "court",
        userMessage: userMsg,
        assistantReply: turns.map((turn) => `${turn.roleId}: ${turn.line}`).join("; "),
        manifest,
        outcome: "fallback",
      }).catch(() => undefined);
    } else {
      await queueChildModelCall({
        handle: platformHandle,
        turnId,
        surface: "court-bicker",
        manifest,
        requestedModel: model,
        fallback: true,
        callIndex,
        latencyMs: Date.now() - startedAt,
      }).catch(() => undefined);
    }
    return Response.json({ turns });
  }
}
