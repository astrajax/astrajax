import type { UserBrainIntake } from "@/lib/aie-demo/types";
import { ROOM_SCRIPTS } from "@/lib/clive/room-scripts";

function brainsIntroMonologue(): string {
  return ROOM_SCRIPTS.find((r) => r.step === "brains_intro")?.monologue ?? "";
}

/** Personalized BRAINS intro after user brain intake — ties intake to why themes come next. */
export function brainsIntroGreeting(intake: UserBrainIntake | null | undefined): string {
  const monologue = brainsIntroMonologue();
  const name = intake?.name?.trim();
  const goal = intake?.goal?.trim();

  if (name && goal) {
    return `${name} — you've told me you're building toward ${goal}. Before we touch a workshop draft, here's why we pause on Brain themes and what they are.\n\n${monologue}`;
  }
  if (name) {
    return `${name} — before we draft anything, here's what "Brains" means here and why we're pausing on it.\n\n${monologue}`;
  }
  return `Before we draft anything, here's what "Brains" means in AstraJax — and why we're here.\n\n${monologue}`;
}

/** Workshop draft beat — demo Northline brief after themes, not a generic team interview. */
export function businessBrainGreeting(intake: UserBrainIntake | null | undefined): string {
  const name = intake?.name?.trim();
  const lead = name
    ? `${name}, you've seen the five Brain themes. For this demo walkthrough I've assembled a workshop draft`
    : `You've seen the five Brain themes. For this demo walkthrough I've assembled a workshop draft`;
  return `${lead} for Northline Field Ops — a fictional field-sales team. Nothing here is trusted yet; it's material for Pam's sniff test and your approval decision.`;
}

/** Real draft truths from Workshop — architect journal path. */
export function truthApprovalGreeting(intake: UserBrainIntake | null | undefined): string {
  const name = intake?.name?.trim();
  const lead = name
    ? `${name}, you've seen the five Brain themes. These are draft truths sitting in the Workshop`
    : `You've seen the five Brain themes. These are draft truths sitting in the Workshop`;
  return `${lead} — proposed context, not trusted yet. Pam will challenge; you decide what Doc may promote to the Trusted Brain.`;
}
