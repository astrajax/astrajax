import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { AgentVerdict, CourtAttendantId, CourtVerdict } from "@/lib/platform/court";
import { COURT_ATTENDANT_POOL, DEFAULT_BENCH } from "@/lib/platform/court";
import { COURT_CAST_PERSONAS, SHARED_COURT_RULES } from "@/lib/platform/court-cast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_VERDICTS: CourtVerdict[] = [
  "Approve",
  "Strong approve",
  "Disapprove",
  "Strong disapprove",
  "LOVE",
  "HATE",
];

/** Offline/failure verdicts, one per attendant — the bench never sits mute. */
const CANNED_VERDICT_BY_ROLE: Record<CourtAttendantId, AgentVerdict> = {
  clive: {
    roleId: "clive",
    verdict: "Approve",
    summary:
      "There is genuine upside here if we think of the humans who will benefit. Adoption follows helpfulness, and I see both.",
  },
  pam: {
    roleId: "pam",
    verdict: "Disapprove",
    summary:
      "The weakest assumption is rep discipline. Without sign-off compliance data from the pilot, we are guessing. Evidence before enthusiasm.",
  },
  doc: {
    roleId: "doc",
    verdict: "Approve",
    summary:
      "Execution is clean. One truth promote, two linked examples, one workshop row retired. I can move on recorded judgement.",
  },
  lazlo: {
    roleId: "lazlo",
    verdict: "Strong approve",
    summary:
      "The narrative holds if we frame it as logged exceptions, not a culture of wiggle room. Leadership will believe that. The story lands.",
  },
  "clive-man": {
    roleId: "clive-man",
    verdict: "Disapprove",
    summary:
      "The record must be exact. UK-only until Ireland evidence clears review. A narrow precedent now saves the record later.",
  },
  kate: {
    roleId: "kate",
    verdict: "Approve",
    summary:
      "Buildable as specified, and the change is reversible if we are wrong. Cut the smallest testable slice first, prove it on the bench, then widen. I have seen the seam and the rollback; I am content.",
  },
};

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

function extractJsonFromText(text: string): {
  verdict?: string;
  summary?: string;
} {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

function normalizeVerdict(raw: string): CourtVerdict {
  const trimmed = raw.trim();
  if (VALID_VERDICTS.includes(trimmed as CourtVerdict)) {
    return trimmed as CourtVerdict;
  }
  return "Disapprove";
}

export async function POST(request: Request) {
  const { title, context, stakes, attendees: attendeesRaw } =
    await request.json();

  if (typeof title !== "string" || title.length === 0 || title.length > 500) {
    return Response.json(
      { error: "Invalid title: must be a non-empty string, max 500 chars" },
      { status: 400 }
    );
  }
  if (
    typeof context !== "string" ||
    context.length === 0 ||
    context.length > 500
  ) {
    return Response.json(
      { error: "Invalid context: must be a non-empty string, max 500 chars" },
      { status: 400 }
    );
  }
  if (typeof stakes !== "string" || stakes.length === 0 || stakes.length > 500) {
    return Response.json(
      { error: "Invalid stakes: must be a non-empty string, max 500 chars" },
      { status: 400 }
    );
  }

  const attendees = parseAttendees(attendeesRaw);
  const matter = `Title: ${title}\n\nContext: ${context}\n\nStakes: ${stakes}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.COURT_MODEL || "claude-haiku-4-5-20251001";

  if (!apiKey) {
    return Response.json({
      verdicts: attendees.map((id) => CANNED_VERDICT_BY_ROLE[id]),
    });
  }

  const promises = attendees.map(async (roleId) => {
    try {
      const response = await generateText({
        model: anthropic(model),
        system: `${COURT_CAST_PERSONAS[roleId]}\n\n${SHARED_COURT_RULES}\n\nReply ONLY with JSON: {"verdict": one of "Approve"|"Strong approve"|"Disapprove"|"Strong disapprove"|"LOVE"|"HATE", "summary": your in-character reasoning, 100-150 words}`,
        prompt: matter,
        maxOutputTokens: 400,
        temperature: 0.8,
      });

      const parsed = extractJsonFromText(response.text);
      const verdict = normalizeVerdict(parsed.verdict || "Disapprove");
      const summary =
        typeof parsed.summary === "string"
          ? parsed.summary.substring(0, 500)
          : "Unable to form a clear perspective on this matter.";

      return { roleId, verdict, summary };
    } catch {
      return CANNED_VERDICT_BY_ROLE[roleId];
    }
  });

  const results = await Promise.allSettled(promises);
  const verdicts: AgentVerdict[] = results.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return CANNED_VERDICT_BY_ROLE[attendees[i]];
  });

  return Response.json({ verdicts });
}
