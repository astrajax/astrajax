import { ARCHITECT_LOOP_STEPS, LOOP_STEPS, type LoopStep } from "@/lib/aie-demo/types";

export type HubBookId = "welcome" | "reason" | "architect" | "brain-building";

const HUB_BOOK_IDS: HubBookId[] = ["welcome", "reason", "architect", "brain-building"];

export function isHubBookId(value: string | null | undefined): value is HubBookId {
  return Boolean(value && HUB_BOOK_IDS.includes(value as HubBookId));
}

export function stepForBook(book: HubBookId): {
  currentStep: LoopStep;
  skipWelcomeSequence: boolean;
} {
  switch (book) {
    case "welcome":
      return { currentStep: "welcome", skipWelcomeSequence: false };
    case "reason":
      return { currentStep: "context_importance", skipWelcomeSequence: true };
    case "architect":
      return { currentStep: "user_brain", skipWelcomeSequence: true };
    case "brain-building":
      return { currentStep: "brains_intro", skipWelcomeSequence: true };
  }
}

export function chapter1BookHref(book: HubBookId): string {
  return `/chapter-1?book=${book}`;
}

export function getLoopStepsForBook(book: HubBookId | null): readonly LoopStep[] {
  if (book === "architect") return ARCHITECT_LOOP_STEPS;
  return LOOP_STEPS;
}
