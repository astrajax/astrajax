import type { ContextSnippet } from "./types";
import { hashContent } from "./grants-store";
import { airtableSelect, escapeAirtableString } from "./airtable-rest";
import {
  getTrustedBrainConfig,
  getTrustedReadToken,
} from "./config";

/**
 * Canonical Brain context scope format: read:brain-context:<area>
 *
 * Demo scopes aligned with Trusted Brain seed rows (exact-match filtering):
 * - read:brain-context:positioning
 * - read:brain-context:governance
 */
export const DEMO_SCOPES = [
  "read:brain-context:positioning",
  "read:brain-context:governance",
] as const;

export type DemoScope = (typeof DEMO_SCOPES)[number];

type AirtableRecord = {
  id: string;
  fields?: {
    Title?: string;
    "Canonical Text"?: string;
    Category?: string;
    Scope?: string;
  };
};

/** Fallback snippets when Trusted Brain is not wired yet — public-safe positioning only. */
export const FALLBACK_TRUSTED_SNIPPETS: ContextSnippet[] = [
  {
    recordId: "fallback-positioning",
    title: "What AstraJax is",
    text: "AstraJax helps domain experts build the brain and shape the fleet. Clive reasons. Pam challenges. Humans decide. Doc acts.",
    contentHash: hashContent(
      "AstraJax helps domain experts build the brain and shape the fleet. Clive reasons. Pam challenges. Humans decide. Doc acts.",
    ),
  },
];

async function fetchAirtableRecords(
  baseId: string,
  tableId: string,
  token: string,
  scope: string,
): Promise<AirtableRecord[]> {
  const escapedScope = escapeAirtableString(scope);
  const formula = `{Scope}='${escapedScope}'`;

  const records = await airtableSelect(baseId, tableId, token, {
    filterByFormula: formula,
    fields: ["Title", "Canonical Text", "Category", "Scope"],
    maxRecords: 100,
  });

  return records as AirtableRecord[];
}

export async function retrieveTrustedSnippets(input: {
  brainSlug: string;
  scope: string;
}): Promise<ContextSnippet[]> {
  const config = getTrustedBrainConfig(input.brainSlug);
  if (!config?.contextTableId) {
    return FALLBACK_TRUSTED_SNIPPETS;
  }

  const token = getTrustedReadToken(config);
  if (!token) {
    return FALLBACK_TRUSTED_SNIPPETS;
  }

  const records = await fetchAirtableRecords(
    config.baseId,
    config.contextTableId,
    token,
    input.scope,
  );

  const snippets = records
    .map((record): ContextSnippet | null => {
      const title = record.fields?.Title;
      const text = record.fields?.["Canonical Text"];
      if (!title || !text) return null;
      return {
        recordId: record.id,
        title,
        text,
        contentHash: hashContent(text),
      };
    })
    .filter((s): s is ContextSnippet => s !== null);

  return snippets.length > 0 ? snippets : FALLBACK_TRUSTED_SNIPPETS;
}
