import { airtableSelect } from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { getRegistryBaseId, getRegistryReadToken } from "../config";
import {
  BRAINS_SHELF,
  deriveHealthBand,
  shrineArtForBand,
  type BrainHealthBand,
  type BrainShelfEntry,
} from "@/lib/platform/brains";
import { DEFAULT_BRAIN_HEALTH } from "@/lib/platform/brain-health";

type RegistryBrainFields = {
  "Brain Slug"?: string;
  "Brain Name"?: string;
  Purpose?: string;
  Maturity?: string;
  Status?: string;
};

function mapMaturityLabel(value: string | undefined): string {
  const raw = (value ?? "Working").trim();
  if (/brain$/i.test(raw)) return raw;
  return `${raw} Brain`;
}

function mapRegistryRecord(record: { id: string; fields: RegistryBrainFields }): BrainShelfEntry | null {
  const slug = record.fields["Brain Slug"]?.trim();
  const name = record.fields["Brain Name"]?.trim();
  if (!slug || !name) return null;

  const flagsCount =
    BRAINS_SHELF.find((brain) => brain.slug === slug)?.flagsCount ??
    DEFAULT_BRAIN_HEALTH.metrics.knownGaps.length;

  const healthBand: BrainHealthBand = deriveHealthBand(
    DEFAULT_BRAIN_HEALTH.metrics,
    flagsCount,
    DEFAULT_BRAIN_HEALTH.eligibility,
  );

  const seeded = BRAINS_SHELF.find((brain) => brain.slug === slug);

  return {
    slug,
    name,
    theme: record.fields.Purpose?.trim() || seeded?.theme || "Governed context",
    maturityLabel: mapMaturityLabel(record.fields.Maturity ?? seeded?.maturityLabel),
    healthBand: seeded?.healthBand ?? healthBand,
    lastAuditAt: seeded?.lastAuditAt ?? DEFAULT_BRAIN_HEALTH.metrics.lastReviewed,
    flagsCount: seeded?.flagsCount ?? flagsCount,
    jarArtSrc: seeded?.jarArtSrc ?? shrineArtForBand(healthBand),
  };
}

export async function handleBrainList(): Promise<{
  brains: BrainShelfEntry[];
  source: "seed" | "live";
  message?: string;
}> {
  const baseId = getRegistryBaseId();
  const token = getRegistryReadToken();
  const tableId = process.env.BRAIN_REGISTRY_BRAINS_TABLE_ID ?? BRAIN_REGISTRY_TABLES.brains;

  if (!baseId || !token) {
    return {
      brains: BRAINS_SHELF,
      source: "seed",
      message: "Registry read token not configured — showing seeded shelf.",
    };
  }

  try {
    const records = await airtableSelect(baseId, tableId, token, {
      maxRecords: 25,
      sortField: "Brain Name",
      sortDirection: "asc",
    });

    const brains = records
      .map(mapRegistryRecord)
      .filter((brain): brain is BrainShelfEntry => brain !== null);

    if (brains.length === 0) {
      return {
        brains: BRAINS_SHELF,
        source: "seed",
        message: "Registry returned no brains — showing seeded shelf.",
      };
    }

    return { brains, source: "live" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load brain registry.";
    return {
      brains: BRAINS_SHELF,
      source: "seed",
      message,
    };
  }
}
