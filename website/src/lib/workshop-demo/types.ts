import type { PaperTrailLine } from "@/lib/platform/brain-health";

export const WORKSHOP_BUILD_STEPS = [
  "routing",
  "brief",
  "proposer",
  "challenger",
  "approval",
  "builder",
  "export",
] as const;

export type WorkshopBuildStep = (typeof WORKSHOP_BUILD_STEPS)[number];

export type TrinityLane = "proposer" | "challenger" | "builder" | "human";

export interface WorkshopDemoState {
  currentStep: WorkshopBuildStep;
  approverName: string;
  humanApproved: boolean;
  buildComplete: boolean;
  paperTrail: PaperTrailLine[];
}

export interface StepNavProps {
  state: WorkshopDemoState;
  onUpdate: (patch: Partial<WorkshopDemoState>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export function stepIndex(step: WorkshopBuildStep): number {
  return WORKSHOP_BUILD_STEPS.indexOf(step);
}

export function nextStep(step: WorkshopBuildStep): WorkshopBuildStep | null {
  const idx = stepIndex(step);
  return idx < WORKSHOP_BUILD_STEPS.length - 1 ? WORKSHOP_BUILD_STEPS[idx + 1]! : null;
}

export function prevStep(step: WorkshopBuildStep): WorkshopBuildStep | null {
  const idx = stepIndex(step);
  return idx > 0 ? WORKSHOP_BUILD_STEPS[idx - 1]! : null;
}

export function laneForStep(step: WorkshopBuildStep): TrinityLane | null {
  switch (step) {
    case "proposer":
      return "proposer";
    case "challenger":
      return "challenger";
    case "builder":
    case "export":
      return "builder";
    case "approval":
      return "human";
    default:
      return null;
  }
}
