import {
  BRAIN_REGISTRY_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_WORKSHOP_BASE_ID,
  BRAIN_WORKSHOP_TABLES,
} from "./airtable-ids";

/** Server-only Brain Key configuration. Never import from client components. */

export type InteractionReadMode = "brain_only" | "dual" | "household_only";
export type InteractionWriteTarget = "brain_interactions" | "household_activity";

export interface TrustedBrainConfig {
  slug: string;
  baseId: string;
  readTokenEnvKey: string;
  truthTableId?: string;
}

const DEFAULT_GRANT_MINUTES = 15;
const DEFAULT_MAX_USES = 3;

export function getDefaultGrantMinutes(): number {
  const raw = process.env.BRAIN_KEY_DEFAULT_GRANT_MINUTES;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_GRANT_MINUTES;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GRANT_MINUTES;
}

export function getDefaultMaxUses(): number {
  const raw = process.env.BRAIN_KEY_DEFAULT_MAX_USES;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_MAX_USES;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_USES;
}

export function useMemoryStore(): boolean {
  if (process.env.BRAIN_KEY_USE_MEMORY === "true") return true;
  if (process.env.BRAIN_KEY_USE_MEMORY === "false") return false;
  return !process.env.BRAIN_REGISTRY_READ_TOKEN;
}

export function getInteractionReadMode(): InteractionReadMode {
  const raw = process.env.INTERACTION_READ_MODE;
  if (raw === "dual" || raw === "household_only") return raw;
  return "brain_only";
}

export function getInteractionWriteTarget(): InteractionWriteTarget {
  return process.env.INTERACTION_WRITE_TARGET === "household_activity"
    ? "household_activity"
    : "brain_interactions";
}

export function getRegistryBaseId(): string | undefined {
  return process.env.BRAIN_REGISTRY_BASE_ID ?? BRAIN_REGISTRY_BASE_ID;
}

export function getRegistryReadToken(): string | undefined {
  return process.env.BRAIN_REGISTRY_READ_TOKEN;
}

export function getRegistryWriteToken(): string | undefined {
  return process.env.BRAIN_KEY_ADMIN_TOKEN ?? process.env.BRAIN_REGISTRY_WRITE_TOKEN;
}

export function getHouseholdActivityBaseId(): string {
  return process.env.HOUSEHOLD_ACTIVITY_BASE_ID ?? "appF7jQD4ZKrDC7e1";
}

export function getHouseholdActivityTableId(): string {
  return process.env.HOUSEHOLD_ACTIVITY_TABLE_ID ?? "tblNxNLyC31KDQbRl";
}

export function getHouseholdActivityReadToken(): string | undefined {
  return process.env.HOUSEHOLD_ACTIVITY_READ_TOKEN;
}

export function getHouseholdActivityReviewToken(): string | undefined {
  return process.env.HOUSEHOLD_ACTIVITY_REVIEW_TOKEN;
}

export function getWorkshopBaseId(): string | undefined {
  return process.env.BRAIN_WORKSHOP_BASE_ID ?? BRAIN_WORKSHOP_BASE_ID;
}

export function getWorkshopWriteToken(): string | undefined {
  return process.env.BRAIN_WORKSHOP_WRITE_TOKEN;
}

/** Read path for Workshop tables — falls back to write/promote tokens when no read PAT is set. */
export function getWorkshopReadToken(): string | undefined {
  return (
    process.env.BRAIN_WORKSHOP_READ_TOKEN ??
    process.env.BRAIN_WORKSHOP_WRITE_TOKEN ??
    process.env.BRAIN_DOC_PROMOTE_TOKEN
  );
}

export function getDocPromoteToken(): string | undefined {
  return process.env.BRAIN_DOC_PROMOTE_TOKEN;
}

export function getBrainKeyAdminSecret(): string | undefined {
  return process.env.BRAIN_KEY_ADMIN_SECRET;
}

function resolveTrustedTruthTableId(): string {
  return (
    process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID ??
    process.env.BRAIN_TRUSTED_CONTEXT_TABLE_ID ??
    BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth
  );
}

/** Parse BRAIN_TRUSTED_BRAINS JSON: [{ "slug", "baseId", "readTokenEnvKey", "truthTableId?" }] */
export function getTrustedBrainConfigs(): TrustedBrainConfig[] {
  const raw = process.env.BRAIN_TRUSTED_BRAINS;
  if (!raw) {
    const slug = process.env.BRAIN_TRUSTED_DEFAULT_SLUG ?? "astrajax-chapter-1";
    const baseId = process.env.BRAIN_TRUSTED_BASE_ID ?? BRAIN_TRUSTED_CHAPTER1_BASE_ID;
    if (!baseId) return [];
    return [
      {
        slug,
        baseId,
        readTokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
        truthTableId: resolveTrustedTruthTableId(),
      },
    ];
  }
  try {
    const parsed = JSON.parse(raw) as Array<
      TrustedBrainConfig & { contextTableId?: string }
    >;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      slug: entry.slug,
      baseId: entry.baseId,
      readTokenEnvKey: entry.readTokenEnvKey,
      truthTableId: entry.truthTableId ?? entry.contextTableId,
    }));
  } catch {
    return [];
  }
}

export function getTrustedBrainConfig(slug: string): TrustedBrainConfig | undefined {
  return getTrustedBrainConfigs().find((b) => b.slug === slug);
}

export function getTrustedReadToken(config: TrustedBrainConfig): string | undefined {
  return process.env[config.readTokenEnvKey];
}
