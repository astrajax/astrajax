import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { AgentVerdict, CourtVerdict } from "@/lib/platform/court";
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

const CANNED_VERDICTS: AgentVerdict[] = [
  {
    roleId: "clive",
    verdict: "Approve",
    summary:
      "There is genuine upside here if we think of the humans who will benefit. Adoption follows helpfulness, and I see both.",
  },
  {
    roleId: "pam",
    verdict: "Disapprove",
    summary:
      "The weakest assumption is rep discipline. Without sign-off compliance data from the pilot, we are guessing. Evidence before enthusiasm.",
  },
  {
    roleId: "doc",
    verdict: "Approve",
    summary:
      "Execution is clean. One truth promote, two linked examples, one workshop row retired. I can move on recorded judgement.",
  },
  {
    roleId: "lazlo",
    verdict: "Strong approve",
    summary:
      "The narrative holds if we frame it as logged exceptions, not a culture of wiggle room. Leadership will believe that. The story lands.",
  },
  {
    roleId: "clive-man",
    verdict: "Disapprove",
    summary:
      "The record must be exact. UK-only until Ireland evidence clears review. A narrow precedent now saves the record later.",
  },
];

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
  const { title, context, stakes } = await request.json();

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

  const matter = `Title: ${title}\n\nContext: ${context}\n\nStakes: ${stakes}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.COURT_MODEL || "claude-haiku-4-5-20251001";

  if (!apiKey) {
    return Response.json({
      verdicts: CANNED_VERDICTS,
    });
  }

  type AgentId = Exclude<keyof typeof COURT_CAST_PERSONAS, "judge">;
  const agents: AgentId[] = ["clive", "pam", "doc", "lazlo", "clive-man"];

  const promises = agents.map(async (roleId) => {
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
    } catch (error) {
      const cannedFor = CANNED_VERDICTS.find((v) => v.roleId === roleId);
      return (
        cannedFor || {
          roleId,
          verdict: "Disapprove" as CourtVerdict,
          summary: "Unable to form a clear perspective on this matter.",
        }
      );
    }
  });

  const results = await Promise.allSettled(promises);
  const verdicts: AgentVerdict[] = results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    const cannedFor = CANNED_VERDICTS.find((v) => v.roleId === "clive");
    return (
      cannedFor || {
        roleId: "clive" as const,
        verdict: "Disapprove" as CourtVerdict,
        summary: "Unable to form a clear perspective on this matter.",
      }
    );
  });

  return Response.json({ verdicts });
}
