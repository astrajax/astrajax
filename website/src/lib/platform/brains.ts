import type { BrainMetrics, BrainHealthSnapshot, EfficiencyEligibility } from "@/lib/platform/brain-health";
import { DEFAULT_BRAIN_HEALTH } from "@/lib/platform/brain-health";

export type BrainHealthBand = "rotten" | "unhappy" | "okay" | "happy" | "thriving";

export interface BrainShelfEntry {
  slug: string;
  name: string;
  theme: string;
  maturityLabel: string;
  healthBand: BrainHealthBand;
  lastAuditAt: string | null;
  flagsCount: number;
  jarArtSrc: string;
}

export const DEFAULT_BRAIN_SLUG = "northline-field-ops";
export const SHRINE_STAGE_SRC = "/brain/shrine-stage.png";
export const INTAKE_HERO_SRC = "/brain/intake-hero.png";

export const HEALTH_BAND_ART_SRC: Record<BrainHealthBand, string> = {
  rotten: "/brain/shrine-rotten.mp4",
  unhappy: "/brain/shrine-unhappy.mp4",
  okay: "/brain/shrine-okay.mp4",
  happy: "/brain/shrine-happy.mp4",
  thriving: "/brain/shrine-thriving.mp4",
};

export function shrineArtForBand(band: BrainHealthBand): string {
  return HEALTH_BAND_ART_SRC[band];
}

export const HEALTH_BAND_LABELS: Record<BrainHealthBand, string> = {
  rotten: "Rotten",
  unhappy: "Unhappy",
  okay: "Okay",
  happy: "Happy",
  thriving: "Thriving",
};

export const HEALTH_BAND_CSS_VAR: Record<BrainHealthBand, string> = {
  rotten: "var(--color-health-rotten)",
  unhappy: "var(--color-health-unhappy)",
  okay: "var(--color-health-okay)",
  happy: "var(--color-health-happy)",
  thriving: "var(--color-health-thriving)",
};

export function healthBandLabel(band: BrainHealthBand): string {
  return HEALTH_BAND_LABELS[band];
}

export function deriveHealthBand(
  metrics: BrainMetrics,
  flagsCount: number,
  eligibility: Pick<EfficiencyEligibility, "signOffCurrent">,
): BrainHealthBand {
  const trendMultiplier =
    metrics.answerFailureTrend === "worsening"
      ? 1.5
      : metrics.answerFailureTrend === "improving"
        ? 0.5
        : 1;

  let score = 100;
  score -= metrics.contradictionCount * 12;
  score -= metrics.answerFailureRate * trendMultiplier;
  score -= metrics.staleRecordCount * 3;
  score -= metrics.knownGaps.length * 4;
  score -= flagsCount * 5;
  if (!eligibility.signOffCurrent) score -= 10;

  if (score >= 85) return "thriving";
  if (score >= 70) return "happy";
  if (score >= 50) return "okay";
  if (score >= 30) return "unhappy";
  return "rotten";
}

export const BRAINS_SHELF: BrainShelfEntry[] = [
  {
    slug: "northline-field-ops",
    name: "Northline Field Ops Brain",
    theme: "Field sales operations",
    maturityLabel: "Working Brain",
    healthBand: "happy",
    lastAuditAt: "2026-06-24T14:30:00.000Z",
    flagsCount: 2,
    jarArtSrc: shrineArtForBand("happy"),
  },
  {
    slug: "pricing-guardrails",
    name: "Pricing Guardrails Brain",
    theme: "Commercial guardrails",
    maturityLabel: "Sharp Brain",
    healthBand: "thriving",
    lastAuditAt: "2026-06-28T11:00:00.000Z",
    flagsCount: 0,
    jarArtSrc: shrineArtForBand("thriving"),
  },
  {
    slug: "forecast-coach",
    name: "Forecast Coach Brain",
    theme: "Planning and forecasting",
    maturityLabel: "Working Brain",
    healthBand: "okay",
    lastAuditAt: "2026-06-20T09:15:00.000Z",
    flagsCount: 1,
    jarArtSrc: shrineArtForBand("okay"),
  },
  {
    slug: "astrajax-chapter-1",
    name: "AstraJax Chapter 1",
    theme: "Governed demo brain",
    maturityLabel: "Seedling Brain",
    healthBand: "unhappy",
    lastAuditAt: null,
    flagsCount: 4,
    jarArtSrc: shrineArtForBand("unhappy"),
  },
];

export function getBrainBySlug(slug: string): BrainShelfEntry | undefined {
  return BRAINS_SHELF.find((brain) => brain.slug === slug);
}

export function findBrainInList(
  slug: string,
  list: readonly BrainShelfEntry[],
): BrainShelfEntry | undefined {
  return list.find((brain) => brain.slug === slug);
}

export function getBrainIndex(slug: string): number {
  const idx = BRAINS_SHELF.findIndex((brain) => brain.slug === slug);
  return idx >= 0 ? idx : 0;
}

export function cycleBrainSlug(slug: string, direction: -1 | 1): string {
  const idx = getBrainIndex(slug);
  const next = (idx + direction + BRAINS_SHELF.length) % BRAINS_SHELF.length;
  return BRAINS_SHELF[next]!.slug;
}

export function formatAuditDate(iso: string | null): string {
  if (!iso) return "Not yet audited";
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Compact date for the shrine audit slot (1024×571 art). */
export function formatShrineAuditDate(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function getBrainHealthSnapshot(
  slug: string,
  brain?: BrainShelfEntry,
): BrainHealthSnapshot {
  const entry = brain ?? getBrainBySlug(slug);
  if (!entry || slug === DEFAULT_BRAIN_HEALTH.brainSlug) {
    return DEFAULT_BRAIN_HEALTH;
  }
  return {
    ...DEFAULT_BRAIN_HEALTH,
    brainSlug: slug,
    brainName: entry.name,
  };
}

export function getBrainHealthBandForSlug(
  slug: string,
  brain?: BrainShelfEntry,
): BrainHealthBand {
  const entry = brain ?? getBrainBySlug(slug);
  if (entry) return entry.healthBand;
  return deriveHealthBand(
    DEFAULT_BRAIN_HEALTH.metrics,
    0,
    DEFAULT_BRAIN_HEALTH.eligibility,
  );
}
