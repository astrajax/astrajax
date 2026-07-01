import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import {
  getProfileById,
  inferProfileFromIntake,
} from "@/lib/aie-demo/user-brain-intake";
import { USER_BRAIN_PROFILES } from "@/lib/aie-demo/demo-data";
import type { IntakeAnswer, UserBrainIntake } from "@/lib/aie-demo/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTAKE_QUESTION_COUNT = 6;

type ClassifyRequest = {
  intake?: Partial<UserBrainIntake>;
  answers?: IntakeAnswer[];
};

function sanitiseAnswers(raw: unknown): IntakeAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is IntakeAnswer =>
        typeof item === "object" &&
        item !== null &&
        typeof item.questionId === "string" &&
        typeof item.answer === "string",
    )
    .slice(0, 10);
}

function intakeFromBody(body: ClassifyRequest): UserBrainIntake {
  const intake = body.intake ?? {};
  return {
    name: typeof intake.name === "string" ? intake.name.trim().slice(0, 120) : undefined,
    role: typeof intake.role === "string" ? intake.role.trim().slice(0, 300) : undefined,
    devExperience:
      typeof intake.devExperience === "string" ? intake.devExperience.trim().slice(0, 300) : undefined,
    aiComfort:
      typeof intake.aiComfort === "string" ? intake.aiComfort.trim().slice(0, 300) : undefined,
    contextFamiliarity:
      typeof intake.contextFamiliarity === "string"
        ? intake.contextFamiliarity.trim().slice(0, 300)
        : undefined,
    goal: typeof intake.goal === "string" ? intake.goal.trim().slice(0, 300) : undefined,
    rawAnswers: sanitiseAnswers(body.answers ?? intake.rawAnswers),
    questionIndex: INTAKE_QUESTION_COUNT,
  };
}

const PROFILE_IDS = USER_BRAIN_PROFILES.map((p) => p.id).join(", ");

export async function POST(request: Request) {
  let body: ClassifyRequest;

  try {
    body = (await request.json()) as ClassifyRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const intake = intakeFromBody(body);
  const fallback = inferProfileFromIntake(intake);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const profile = getProfileById(fallback.profileId)!;
    return NextResponse.json({
      profileId: fallback.profileId,
      profile,
      summary: fallback.summary,
      reasoning: fallback.reasoning,
      source: "heuristic",
    });
  }

  try {
    const modelId = process.env.CLIVE_MODEL ?? "claude-sonnet-4-6";
    const answerBlock = intake.rawAnswers
      .map((a) => `- ${a.question}\n  Answer: ${a.answer}`)
      .join("\n");

    const result = await generateText({
      model: anthropic(modelId),
      system: `You classify a Chapter 1 user into exactly one User Brain profile for tone calibration.
Profiles (pick one id only):
${USER_BRAIN_PROFILES.map((p) => `- ${p.id}: ${p.label}`).join("\n")}

Routing rules:
- starting-fresh: little or no AI experience AND little or no context-system familiarity — honest "never", "starting from zero", "no experience" answers belong here even if their role is non-technical.
- commercial-new-context: strong commercial or domain judgement, often already uses AI, but new to governed context systems — NOT for true AI beginners.
- balanced-leader: team leader comfortable with AI and basic context ideas.
- systems-expert: hands-on engineering or deep systems architecture.

Respond with JSON only, no markdown:
{"profileId":"<one of: ${PROFILE_IDS}>","reasoning":"<one sentence why, internal tone>","summary":"<2-3 warm sentences in Clive's voice synthesising what you heard — interpret their situation, do not quote answers verbatim or list fields. Do not name the profile label here.>"}`,
      prompt: `Name: ${intake.name ?? "unknown"}
Role: ${intake.role ?? "unknown"}
Development / system architecture experience: ${intake.devExperience ?? "unknown"}
AI comfort: ${intake.aiComfort ?? "unknown"}
Context familiarity: ${intake.contextFamiliarity ?? "unknown"}
Goal: ${intake.goal ?? "unknown"}

Q&A:
${answerBlock}`,
      maxOutputTokens: 300,
    });

    const parsed = JSON.parse(result.text.trim()) as {
      profileId?: string;
      summary?: string;
      reasoning?: string;
    };

    const profileId = USER_BRAIN_PROFILES.some((p) => p.id === parsed.profileId)
      ? parsed.profileId!
      : fallback.profileId;
    const profile = getProfileById(profileId)!;

    return NextResponse.json({
      profileId,
      profile,
      summary: parsed.summary?.trim() || fallback.summary,
      reasoning: parsed.reasoning?.trim() || fallback.reasoning,
      source: "model",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Classification failed";
    console.warn("User brain classify failed, using heuristic:", detail);
    const profile = getProfileById(fallback.profileId)!;
    return NextResponse.json({
      profileId: fallback.profileId,
      profile,
      summary: fallback.summary,
      reasoning: fallback.reasoning,
      source: "heuristic",
    });
  }
}
