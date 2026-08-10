import {
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  CHAPTER1_BRAIN_SLUG,
} from "@/lib/brains/airtable-ids";
import {
  getTrustedBrainConfig,
  getTrustedReadToken,
} from "@/lib/brains/config";

/**
 * One entry per Airtable table allowed into the search index.
 * Approval filtering belongs in Airtable (view or table boundary), not here.
 */
export type ContextIndexSource = {
  clientId: string;
  baseId: string;
  tableId: string;
  /** Optional Airtable view that already contains only approved / live records. */
  viewId?: string;
  /** Fields to index — each becomes its own searchable chunk. */
  fields: string[];
  /** Field used as the chunk label prefix (usually Title / Name). */
  labelField: string;
  /** Optional approval timestamp field copied into the index. */
  approvedField?: string;
  /** Env key holding the Airtable PAT for this source. */
  tokenEnvKey: string;
};

export function getContextIndexSources(): ContextIndexSource[] {
  const trusted = getTrustedBrainConfig(CHAPTER1_BRAIN_SLUG);
  const baseId =
    trusted?.baseId ??
    process.env.BRAIN_TRUSTED_BASE_ID ??
    BRAIN_TRUSTED_CHAPTER1_BASE_ID;
  const tableId =
    trusted?.truthTableId ??
    process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID ??
    process.env.BRAIN_TRUSTED_CONTEXT_TABLE_ID ??
    BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth;

  return [
    {
      clientId: CHAPTER1_BRAIN_SLUG,
      baseId,
      tableId,
      viewId: process.env.CONTEXT_INDEX_TRUSTED_TRUTH_VIEW_ID || undefined,
      labelField: "Title",
      fields: ["Title", "Canonical Text", "Category", "Scope"],
      approvedField: "Last Reviewed",
      tokenEnvKey: trusted?.readTokenEnvKey ?? "BRAIN_TRUSTED_READ_TOKEN",
    },
  ];
}

export function sourceKey(source: ContextIndexSource): string {
  return `${source.clientId}:${source.baseId}:${source.tableId}`;
}

export function getSourceReadToken(source: ContextIndexSource): string | undefined {
  const fromEnv = process.env[source.tokenEnvKey];
  if (fromEnv) return fromEnv;

  // Fallback through the Trusted Brain helper when the source uses that token.
  if (source.tokenEnvKey === "BRAIN_TRUSTED_READ_TOKEN") {
    const trusted = getTrustedBrainConfig(source.clientId);
    if (trusted) return getTrustedReadToken(trusted);
  }
  return undefined;
}
