import type { BrainThemeRecommendation } from "@/lib/aie-demo/brain-theme-templates";
import type { AccessGrant, BrainKeyRequest, ContextSnippet } from "@/lib/brains/types";
import type { BrainKeyUiState } from "@/lib/brains/types";

export const DEMO_BRAIN_SLUG = "astrajax-chapter-1";

export const LOOP_STEPS = [
  "welcome",
  "context_importance",
  "user_brain",
  "brains_intro",
  "business_brain",
  "pam_challenge",
  "human_decision",
  "doc_handoff",
  "context_access",
  "receipts",
] as const;

/** Architect journal path — real draft truths, no Northline theatre. */
export const ARCHITECT_LOOP_STEPS = [
  "user_brain",
  "brains_intro",
  "truth_approval",
  "human_decision",
  "doc_handoff",
  "context_access",
  "receipts",
] as const;

export type LoopStep = (typeof LOOP_STEPS)[number] | "truth_approval";

/** Maps removed or legacy step ids to the current flow. */
export function resolveLoopStep(step: string | undefined, fallback: LoopStep): LoopStep {
  if (step === "guide" || step === "clive_interview") return "brains_intro";
  const allSteps = [...LOOP_STEPS, "truth_approval"] as const;
  return step && (allSteps as readonly string[]).includes(step) ? (step as LoopStep) : fallback;
}

export type BrainMaturity = "seedling" | "working";

export type GuideMode = "full_story" | "light_story" | "no_story";

export type ConfidenceLevel = "new" | "comfortable" | "expert";

export interface UserBrainProfile {
  id: string;
  label: string;
  aiConfidence: ConfidenceLevel;
  contextConfidence: ConfidenceLevel;
  commercialJudgement: ConfidenceLevel;
  cliveTone: string;
  pamSensitivity: "high" | "medium" | "low";
}

export interface IntakeAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export interface UserBrainIntake {
  name?: string;
  role?: string;
  /** Sector / business type — drives brain theme recommendations. */
  businessSector?: string;
  devExperience?: string;
  aiComfort?: string;
  contextFamiliarity?: string;
  goal?: string;
  rawAnswers: IntakeAnswer[];
  questionIndex: number;
  inferredProfileId?: string;
  inferredSectorId?: string;
  inferredArchetype?: "founder" | "function-leader";
  brainThemeRecommendations?: BrainThemeRecommendation;
  intakeComplete?: boolean;
  classificationSummary?: string;
}

export interface BusinessBrainDraft {
  clientName: string;
  goal: string;
  workflows: string[];
  dataSources: string[];
  approvalRules: string[];
  goodOutput: string;
  neverDo: string[];
  knownGaps: string[];
}

export interface PamSniffTest {
  strongestPart: string;
  weakestAssumption: string;
  missingEvidence: string;
  rabbitHoleRisk: string;
  safeToSendToDoc: "yes" | "not_yet";
}

export interface ReceiptCard {
  id: string;
  title: string;
  summary: string;
  tag?: string;
}

export interface PromoteReceipt {
  promotedRecordIds: string[];
  changeSummary: string;
  executingAgent: string;
  approver: string;
}

export interface DraftTruthItem {
  recordId: string;
  title: string;
  canonicalText: string;
  proposedCategory: string;
  brainTheme?: string;
  status: string;
  proposedByAgent?: string;
  scope: string;
  source: "workshop" | "session" | "fallback";
}

export interface LoopState {
  sessionId: string;
  currentStep: LoopStep;
  brainMaturity: BrainMaturity;
  userBrain: UserBrainProfile | null;
  userBrainIntake: UserBrainIntake | null;
  guideMode: GuideMode | null;
  businessBrain: BusinessBrainDraft;
  pamReview: PamSniffTest;
  keyRequest: BrainKeyRequest | null;
  grant: AccessGrant | null;
  snippets: ContextSnippet[];
  humanApproved: boolean;
  approvalDecisionId: string;
  promoteReceipt: PromoteReceipt | null;
  demoScope: string;
  draftTruths: DraftTruthItem[];
  selectedDraftIds: string[];
  draftTruthsSource?: "workshop" | "session" | "fallback";
  draftTruthsNotice?: string;
}

export interface StepProps {
  state: LoopState;
  accessState: BrainKeyUiState;
  onUpdate: (patch: Partial<LoopState>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const STEP_LABELS: Record<LoopStep, string> = {
  welcome: "Welcome",
  context_importance: "Why Context Matters",
  brains_intro: "BRAINS",
  user_brain: "User Brain",
  truth_approval: "Approve Truths",
  business_brain: "Business Brain",
  pam_challenge: "Pam Challenge",
  human_decision: "Your Decision",
  doc_handoff: "Doc Handoff",
  context_access: "Use Approved Context",
  receipts: "What This Unlocks",
};

export const MATURITY_LABELS: Record<BrainMaturity, string> = {
  seedling: "Seedling Brain",
  working: "Working Brain",
};
