import type { UserBrainIntake } from "@/lib/aie-demo/types";
import {
  GOOD_THEME_QUALITIES,
  WHY_WE_THEME,
  recommendBrainThemes,
} from "@/lib/aie-demo/brain-theme-templates";
import { ROOM_SCRIPTS } from "@/lib/clive/room-scripts";

function brainsIntroMonologue(): string {
  return ROOM_SCRIPTS.find((r) => r.step === "brains_intro")?.monologue ?? "";
}

function primaryThemeLabel(intake: UserBrainIntake): string {
  const rec = intake.brainThemeRecommendations ?? recommendBrainThemes(intake);
  const primary = rec.themes.find((t) => t.id === rec.primaryPickId);
  return primary?.label ?? "Core";
}

/** Personalized BRAINS intro after user brain intake — sector themes, why we theme, what good looks like. */
export function brainsIntroGreeting(intake: UserBrainIntake | null | undefined): string {
  const monologue = brainsIntroMonologue();
  const name = intake?.name?.trim();
  const goal = intake?.goal?.trim();

  if (!intake?.intakeComplete) {
    const lead = name
      ? `${name} — before we draft anything, here's what "Brains" means here.`
      : `Before we draft anything, here's what "Brains" means in AstraJax.`;
    return `${lead}\n\n${monologue}`;
  }

  const rec = intake.brainThemeRecommendations ?? recommendBrainThemes(intake);
  const primaryLabel = primaryThemeLabel(intake);

  const qualitiesBlock = GOOD_THEME_QUALITIES.map((q) => `• ${q.title}: ${q.body}`).join("\n");

  const themeList = rec.themes
    .map((t) => {
      const pick =
        t.id === rec.primaryPickId ? " ← I'd light this one first" : "";
      return `• **${t.label}** — ${t.whyRecommended}${pick}`;
    })
    .join("\n");

  const nameLead = name ? `${name}, ` : "";
  const goalLine = goal ? `You're building toward ${goal}. ` : "";

  return `${nameLead}${goalLine}you've told me enough about your world for me to recommend Brain themes — not a fixed list for everyone, but the domains that fit **${rec.sectorLabel}**.

${WHY_WE_THEME}

**What makes a good theme**
${qualitiesBlock}

**What I'd recommend for you**
${rec.sectorRationale}

${themeList}

Pick **one** to light first — I'd start with **${primaryLabel}**. Lighting everything at once is context bloat; one good brain beats five vague ones.

${monologue}`;
}

/** Workshop draft beat — demo Northline brief after themes, not a generic team interview. */
export function businessBrainGreeting(intake: UserBrainIntake | null | undefined): string {
  const name = intake?.name?.trim();
  const lead = name
    ? `${name}, you've seen your recommended Brain themes. For this demo walkthrough I've assembled a workshop draft`
    : `You've seen your recommended Brain themes. For this demo walkthrough I've assembled a workshop draft`;
  return `${lead} for Northline Field Ops — a fictional field-sales team. Nothing here is trusted yet; it's material for Pam's sniff test and your approval decision.`;
}

/** Real draft truths from Workshop — architect journal path. */
export function truthApprovalGreeting(intake: UserBrainIntake | null | undefined): string {
  const name = intake?.name?.trim();
  const lead = name
    ? `${name}, you've seen your recommended Brain themes. These are draft truths sitting in the Workshop`
    : `You've seen your recommended Brain themes. These are draft truths sitting in the Workshop`;
  return `${lead} — proposed context, not trusted yet. Pam will challenge; you decide what Doc may promote to the Trusted Brain.`;
}
