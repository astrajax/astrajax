import type { BickerTurn, CourtAttendantId } from "@/lib/platform/court";
import { COURT_ATTENDANT_POOL, DEFAULT_BENCH } from "@/lib/platform/court";

/** Offline squabble lines, keyed by speaker — rotation is filtered to
 * whoever is actually seated, so a custom bench never quotes an absent
 * colleague. */
export const SEEDED_BICKER: Array<{ roleId: CourtAttendantId; line: string }> = [
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

export function parseAttendees(raw: unknown): CourtAttendantId[] {
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

export function extractJsonFromText(
  text: string,
): { turns?: Array<{ roleId: string; line: string }> } {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { turns: [] };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { turns: [] };
  }
}

/**
 * Opening flurry: richer first exchange (6–10 turns). Continues use 4–5.
 * True when the client flags it, or when the transcript is empty and the
 * call index is still in the opening window (default callIndex is 5).
 */
export function isOpeningFlurry(
  openingFlurry: unknown,
  transcriptLength: number,
  callIndex: number,
): boolean {
  return openingFlurry === true || (transcriptLength === 0 && callIndex <= 6);
}

export function seedBickerRotation(
  transcriptLength: number,
  attendees: CourtAttendantId[],
  flurry = false,
): BickerTurn[] {
  const pool = SEEDED_BICKER.filter((turn) => attendees.includes(turn.roleId));
  if (pool.length === 0) return [];
  const startIdx = transcriptLength % pool.length;
  const batchSize =
    flurry || transcriptLength === 0 ? Math.min(10, pool.length) : Math.min(5, pool.length);
  const result: BickerTurn[] = [];
  for (let i = 0; i < batchSize; i++) {
    const idx = (startIdx + i) % pool.length;
    result.push(pool[idx]);
  }
  return result;
}

/** Drop model turns that speak for absent cast (or malformed lines). */
export function filterSeatedBickerTurns(
  turns: unknown,
  attendees: CourtAttendantId[],
): BickerTurn[] {
  const isSeatedRoleId = (val: unknown): val is BickerTurn["roleId"] =>
    val === "judge" ||
    val === "user" ||
    (typeof val === "string" && (attendees as string[]).includes(val));

  if (!Array.isArray(turns)) return [];
  return turns
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
}
