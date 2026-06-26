import type { LoopStep } from "@/lib/aie-demo/types";

const BEAT_LABELS: Record<LoopStep, string> = {
  user_brain: "Who sits in the chair",
  guide: "Pick your guide",
  clive_interview: "Build the business brain",
  business_brain: "Review the workshop draft",
  pam_challenge: "Pam's sniff test",
  human_decision: "Your decision",
  doc_handoff: "Doc files the brief",
  context_access: "Use approved context",
  receipts: "What this unlocks",
};

export function beatLabel(beat: LoopStep): string {
  return BEAT_LABELS[beat];
}

export function buildLoopContextSummary(context: {
  userBrainLabel?: string;
  guideMode?: string;
  businessGoal?: string;
  beat?: LoopStep;
  cliveTone?: string;
  pamSensitivity?: "high" | "medium" | "low";
}): string {
  const lines: string[] = [];
  if (context.userBrainLabel) lines.push(`User in the chair: ${context.userBrainLabel}`);
  if (context.cliveTone) lines.push(`Clive should adapt: ${context.cliveTone}`);
  if (context.pamSensitivity) {
    lines.push(`Pam challenge sensitivity: ${context.pamSensitivity}`);
  }
  if (context.guideMode) {
    lines.push(`Guide mode: ${context.guideMode.replace(/_/g, " ")}`);
  }
  if (context.businessGoal) {
    lines.push(`Business brain goal (workshop draft): ${context.businessGoal}`);
  }
  if (context.beat) lines.push(`Current beat: ${beatLabel(context.beat)}`);
  return lines.join("\n");
}
