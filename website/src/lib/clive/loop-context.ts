import type { LoopStep } from "@/lib/aie-demo/types";

const BEAT_LABELS: Record<LoopStep, string> = {
  welcome: "Welcome to Clive's study",
  context_importance: "Why context matters",
  brains_intro: "AstraJax BRAINS",
  user_brain: "Map your user brain",
  truth_approval: "Approve draft truths",
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
  userName?: string;
  userBrainLabel?: string;
  userRole?: string;
  businessSector?: string;
  sectorLabel?: string;
  devExperience?: string;
  aiComfort?: string;
  contextFamiliarity?: string;
  userGoal?: string;
  guideMode?: string;
  businessGoal?: string;
  beat?: LoopStep;
  cliveTone?: string;
  pamSensitivity?: "high" | "medium" | "low";
}): string {
  const lines: string[] = [];
  if (context.userName) lines.push(`User's name: ${context.userName}`);
  if (context.userRole) lines.push(`Role: ${context.userRole}`);
  if (context.businessSector) lines.push(`Business / sector: ${context.businessSector}`);
  if (context.sectorLabel) lines.push(`Inferred sector for brain themes: ${context.sectorLabel}`);
  if (context.devExperience) {
    lines.push(`Development / system architecture (self-reported): ${context.devExperience}`);
  }
  if (context.aiComfort) lines.push(`AI comfort (self-reported): ${context.aiComfort}`);
  if (context.contextFamiliarity) {
    lines.push(`Context systems familiarity: ${context.contextFamiliarity}`);
  }
  if (context.userGoal) lines.push(`Building toward: ${context.userGoal}`);
  if (context.userBrainLabel) lines.push(`Inferred user brain profile: ${context.userBrainLabel}`);
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
  if (context.userName) {
    lines.push(
      "Continuity: the study keeps this record between visits — it is the ledger, and the ledger is your memory. If asked whether you remember this architect, recall warmly from this record and only this record: greet them by name, name what is written here (their role, their goal, how far they got), and pick up from there. Never invent shared memories beyond the ledger; if something isn't recorded, say the ledger doesn't hold it and ask.",
    );
  }
  return lines.join("\n");
}
