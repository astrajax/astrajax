import {
  BRAIN_REGISTRY_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_WORKSHOP_BASE_ID,
  BRAIN_WORKSHOP_TABLES,
} from "./airtable-ids";

/** Server-only Brain Key configuration. Never import from client components. */

export interface TrustedBrainConfig {
  slug: string;
  baseId: string;
  readTokenEnvKey: string;
  contextTableId?: string;
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

export function getRegistryBaseId(): string | undefined {
  return process.env.BRAIN_REGISTRY_BASE_ID ?? BRAIN_REGISTRY_BASE_ID;
}

export function getRegistryReadToken(): string | undefined {
  return process.env.BRAIN_REGISTRY_READ_TOKEN;
}

export function getRegistryWriteToken(): string | undefined {
  return process.env.BRAIN_KEY_ADMIN_TOKEN ?? process.env.BRAIN_REGISTRY_WRITE_TOKEN;
}

export function getWorkshopBaseId(): string | undefined {
  return process.env.BRAIN_WORKSHOP_BASE_ID ?? BRAIN_WORKSHOP_BASE_ID;
}

export function getWorkshopWriteToken(): string | undefined {
  return process.env.BRAIN_WORKSHOP_WRITE_TOKEN;
}

export function getDocPromoteToken(): string | undefined {
  return process.env.BRAIN_DOC_PROMOTE_TOKEN;
}

export function getBrainKeyAdminSecret(): string | undefined {
  return process.env.BRAIN_KEY_ADMIN_SECRET;
}

/** Parse BRAIN_TRUSTED_BRAINS JSON: [{ "slug", "baseId", "readTokenEnvKey", "contextTableId?" }] */
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
        contextTableId:
          process.env.BRAIN_TRUSTED_CONTEXT_TABLE_ID ?? BRAIN_TRUSTED_CHAPTER1_TABLES.brainContext,
      },
    ];
  }
  try {
    const parsed = JSON.parse(raw) as TrustedBrainConfig[];
    return Array.isArray(parsed) ? parsed : [];
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
