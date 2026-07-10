import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { BickerTurn, CourtAttendantId } from "@/lib/platform/court";
import { COURT_ATTENDANT_POOL, DEFAULT_BENCH } from "@/lib/platform/court";
import { COURT_CAST_PERSONAS, SHARED_COURT_RULES } from "@/lib/platform/court-cast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Offline squabble lines, keyed by speaker — rotation is filtered to
 * whoever is actually seated, so a custom bench never quotes an absent
 * colleague. */
const SEEDED_BICKER: Array<{ roleId: CourtAttendantId; line: string }> = [
  { roleId: "clive", line: "Poor things, we are all trying our best here." },
  {
    roleId: "pam",
    line: "Trying is not the same as evidence, Clive. What data have we actually seen?",
  },
  {
    roleId: "doc",
    line: "Data matters. Effort matters more. I need one to execute the other.",
  },
  {
    roleId: "lazlo",
    line: "And the story has to hold. If the narrative frays, neither data nor effort saves it.",
  },
  {
    roleId: "clive-man",
    line: "What the record says now shapes what it says afterwards. Precision is not negotiable.",
  },
  {
    roleId: "kate",
    line: "Show me the first cut before the grand plan. A thing that cannot be built small cannot be trusted big.",
  },
  {
    roleId: "pam",
    line: "Clive, I hear the optimism, but the pilot data on sign-off compliance is thin.",
  },
  {
    roleId: "doc",
    line: "Then we gather the data before I execute. No record gets written on applause.",
  },
  {
    roleId: "lazlo",
    line: "Unless the narrative itself teaches the discipline. Frame it well and reps will follow.",
  },
  {
    roleId: "kate",
    line: "Frames are lovely, Lazlo, until someone leans on one. Where is the rollback if it cracks?",
  },
  {
    roleId: "clive-man",
    line: "Frame is not governance, Lazlo. The boundary is the boundary.",
  },
  {
    roleId: "halvard",
    line: "Half this room says fine and means tired, Pam. Treat the real condition, not the reported one.",
  },
  {
    roleId: "milo",
    line: "Tempo, friends. Even the right decision falls over at the wrong speed.",
  },
  {
    roleId: "clive",
    line: "Then let us find the frame that makes the boundary easy to live with, yes?",
  },
];

function parseAttendees(raw: unknown): CourtAttendantId[] {
  if (!Array.isArray(raw)) return DEFAULT_BENCH;
  const seen = new Set<CourtAttendantId>();
  for (const id of raw) {
    if (
      typeof id === "string" &&
      (COURT_ATTENDANT_POOL as string[]).includes(id)
    ) {
      seen.add(id as CourtAttendantId);
    }
  }
  const list = [...seen];
  if (list.length === 0 || list.length > 5) return DEFAULT_BENCH;
  return list;
}

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

function seedBickerRotation(
  transcriptLength: number,
  attendees: CourtAttendantId[]
): BickerTurn[] {
  const pool = SEEDED_BICKER.filter((turn) => attendees.includes(turn.roleId));
  if (pool.length === 0) return [];
  const startIdx = transcriptLength % pool.length;
  const result: BickerTurn[] = [];
  for (let i = 0; i < Math.min(3, pool.length); i++) {
    const idx = (startIdx + i) % pool.length;
    result.push(pool[idx]);
  }
  return result;
}

export async function POST(request: Request) {
  const { title, context, stakes, transcript, userMessage, attendees: attendeesRaw } =
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

  const attendees = parseAttendees(attendeesRaw);
  const isSeatedRoleId = (val: unknown): val is BickerTurn["roleId"] =>
    val === "judge" ||
    val === "user" ||
    (typeof val === "string" &&
      (attendees as string[]).includes(val));

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
      turns: seedBickerRotation(transcript.length, attendees),
    });
  }

  const personaBlock = [...attendees, "judge" as const]
    .map((id) => COURT_CAST_PERSONAS[id])
    .join("\n");
  const roleIdList = [...attendees, "judge"].join("|");

  try {
    const response = await generateText({
      model: anthropic(model),
      system: `${personaBlock}

${SHARED_COURT_RULES}

Only these bench members are seated this session: ${attendees.join(", ")} (plus the judge). No other cast member is present; never speak for an absent colleague. Continue the squabble between the seated bench members about the matter. Produce the next 2 or 3 short turns as JSON {"turns":[{"roleId":"${roleIdList}","line":"..."}]}. Each line under 35 words. They bicker—interrupt, needle each other by name, disagree in character. They never conclude or vote. The judge speaks at most rarely and only to note the human decides.${userMsg ? ' If the transcript ends with a turn from the petitioner, the bench must respond to them directly (address them as "the petitioner" or by their words), at least one turn doing so.' : ""}`,
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
          isSeatedRoleId((turn as { roleId: unknown }).roleId) &&
          typeof (turn as { line: unknown }).line === "string"
        );
      })
      .map((turn) => ({
        roleId: turn.roleId,
        line: String(turn.line).substring(0, 300),
      }));

    return Response.json({ turns });
  } catch {
    return Response.json({
      turns: seedBickerRotation(transcript.length, attendees),
    });
  }
}
