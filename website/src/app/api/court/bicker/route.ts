import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { BickerTurn, CourtRoleId } from "@/lib/platform/court";
import { COURT_CAST_PERSONAS, SHARED_COURT_RULES } from "@/lib/platform/court-cast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEEDED_BICKER = [
  { roleId: "clive" as CourtRoleId, line: "Poor things, we are all trying our best here." },
  {
    roleId: "pam" as CourtRoleId,
    line: "Trying is not the same as evidence, Clive. What data have we actually seen?",
  },
  {
    roleId: "doc" as CourtRoleId,
    line: "Data matters. Effort matters more. I need one to execute the other.",
  },
  {
    roleId: "lazlo" as CourtRoleId,
    line: "And the story has to hold. If the narrative frays, neither data nor effort saves it.",
  },
  {
    roleId: "clive-man" as CourtRoleId,
    line: "What the record says now shapes what it says afterwards. Precision is not negotiable.",
  },
  {
    roleId: "pam" as CourtRoleId,
    line: "Clive, I hear the optimism, but the pilot data on sign-off compliance is thin.",
  },
  {
    roleId: "doc" as CourtRoleId,
    line: "Then we gather the data before I execute. No record gets written on applause.",
  },
  {
    roleId: "lazlo" as CourtRoleId,
    line: "Unless the narrative itself teaches the discipline. Frame it well and reps will follow.",
  },
  {
    roleId: "clive-man" as CourtRoleId,
    line: "Frame is not governance, Lazlo. The boundary is the boundary.",
  },
  {
    roleId: "clive" as CourtRoleId,
    line: "Then let us find the frame that makes the boundary easy to live with, yes?",
  },
];

function extractJsonFromText(
  text: string
): { turns?: Array<{ roleId: string; line: string }> } {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { turns: [] };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { turns: [] };
  }
}

function isValidRoleId(val: unknown): val is CourtRoleId | "user" {
  return (
    val === "clive" ||
    val === "pam" ||
    val === "doc" ||
    val === "lazlo" ||
    val === "clive-man" ||
    val === "judge" ||
    val === "user"
  );
}

function seedBickerRotation(transcriptLength: number): BickerTurn[] {
  const startIdx = transcriptLength % SEEDED_BICKER.length;
  const result: BickerTurn[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = (startIdx + i) % SEEDED_BICKER.length;
    result.push(SEEDED_BICKER[idx]);
  }
  return result;
}

export async function POST(request: Request) {
  const { title, context, stakes, transcript, userMessage } =
    await request.json();

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

  const kept = transcript.slice(-14);
  const truncatedTranscript = kept
    .map((turn: { roleId: string; line: string }) => {
      const safeLine = String(turn.line || "").substring(0, 300);
      return `${turn.roleId}: ${safeLine}`;
    })
    .join("\n");

  const userMsg = userMessage ? String(userMessage).substring(0, 400) : "";

  const matter = `Title: ${title}\n\nContext: ${context}\n\nStakes: ${stakes}`;
  const prompt = userMsg
    ? `${matter}\n\nRecent bench discussion:\n${truncatedTranscript}\n\nThe petitioner says: "${userMsg}"\n\nRespond with the next 2-3 short bench turns.`
    : `${matter}\n\nRecent bench discussion:\n${truncatedTranscript}\n\nContinue the squabble with 2-3 more short turns.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.COURT_MODEL || "claude-haiku-4-5-20251001";

  if (!apiKey) {
    return Response.json({
      turns: seedBickerRotation(transcript.length),
    });
  }

  try {
    const response = await generateText({
      model: anthropic(model),
      system: `${COURT_CAST_PERSONAS.clive}
${COURT_CAST_PERSONAS.pam}
${COURT_CAST_PERSONAS.doc}
${COURT_CAST_PERSONAS.lazlo}
${COURT_CAST_PERSONAS["clive-man"]}
${COURT_CAST_PERSONAS.judge}

${SHARED_COURT_RULES}

Continue the squabble between the bench members about the matter. Produce the next 2 or 3 short turns as JSON {"turns":[{"roleId":"clive|pam|doc|lazlo|clive-man|judge","line":"..."}]}. Each line under 35 words. They bicker—interrupt, needle each other by name, disagree in character. They never conclude or vote. The judge speaks at most rarely and only to note the human decides.${userMsg ? ' If the transcript ends with a turn from the petitioner, the bench must respond to them directly (address them as "the petitioner" or by their words), at least one turn doing so.' : ""}`,
      prompt,
      maxOutputTokens: 300,
      temperature: 1,
    });

    const parsed = extractJsonFromText(response.text);
    const turns = (Array.isArray(parsed.turns) ? parsed.turns : [])
      .filter((turn: unknown): turn is BickerTurn => {
        return (
          turn !== null &&
          typeof turn === "object" &&
          "roleId" in turn &&
          "line" in turn &&
          isValidRoleId((turn as { roleId: unknown }).roleId) &&
          typeof (turn as { line: unknown }).line === "string"
        );
      })
      .map((turn) => ({
        roleId: turn.roleId,
        line: String(turn.line).substring(0, 300),
      }));

    return Response.json({ turns });
  } catch (error) {
    return Response.json({
      turns: seedBickerRotation(transcript.length),
    });
  }
}
