import type { AccessGrant, BrainKeyRequest, ContextSnippet } from "@/lib/brains/types";
import type { BrainKeyUiState } from "@/lib/brains/types";

export const DEMO_BRAIN_SLUG = "astrajax-chapter-1";

export const LOOP_STEPS = [
  "welcome",
  "context_importance",
  "brains_intro",
  "user_brain",
  "guide",
  "clive_interview",
  "business_brain",
  "pam_challenge",
  "human_decision",
  "doc_handoff",
  "context_access",
  "receipts",
] as const;

export type LoopStep = (typeof LOOP_STEPS)[number];

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
  devExperience?: string;
  aiComfort?: string;
  contextFamiliarity?: string;
  goal?: string;
  rawAnswers: IntakeAnswer[];
  questionIndex: number;
  inferredProfileId?: string;
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
  guide: "Guide Mode",
  clive_interview: "Clive Interview",
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
