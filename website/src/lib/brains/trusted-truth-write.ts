/**
 * Trusted Brain Truth writes — both text registers, keyed on field IDs.
 *
 * Matthew commissioned this on 17 Aug 2026: a promoted claim must arrive in
 * Trusted with the same two registers it had as a draft, and existing Trusted rows
 * with a blank human register may be filled from their own Canonical Text.
 *
 * Trusted keeps the column name `Canonical Text` — do not rename it. Writes key on
 * field IDs so the name is irrelevant to the payload.
 *
 * Server-only. Never import from a client component.
 */

import {
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS,
  BRAIN_TRUSTED_CREATIVE_BASE_ID,
  BRAIN_TRUSTED_CREATIVE_TABLES,
  BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS,
  BRAIN_REGISTRY_CREATIVE_BRAIN,
  CHAPTER1_BRAIN_SLUG,
} from "./airtable-ids";
import { airtableSelect, airtableUpdate } from "./airtable-rest";
import { deriveHumanText } from "./draft-truth-write";

/** Field IDs for one Trusted Brain Truth table. Both registers, never a name. */
export type TrustedTruthRegisters = {
  brainSlug: string;
  baseId: string;
  tableId: string;
  title: string;
  /** Agent register. Live column name is `Canonical Text`. */
  canonicalText: string;
  /** Human register — same claim, no record IDs. */
  canonicalTextForHumans: string;
  category: string;
  scope: string;
  authority: string;
  freshness: string;
  lastReviewed: string;
};

export const TRUSTED_TRUTH_TABLES: TrustedTruthRegisters[] = [
  {
    brainSlug: CHAPTER1_BRAIN_SLUG,
    baseId: BRAIN_TRUSTED_CHAPTER1_BASE_ID,
    tableId: BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth,
    title: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.title,
    canonicalText: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.canonicalText,
    canonicalTextForHumans:
      BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.canonicalTextForHumans,
    category: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.category,
    scope: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.scope,
    authority: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.authority,
    freshness: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.freshness,
    lastReviewed: BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.lastReviewed,
  },
  {
    brainSlug: BRAIN_REGISTRY_CREATIVE_BRAIN.slug,
    baseId: BRAIN_TRUSTED_CREATIVE_BASE_ID,
    tableId: BRAIN_TRUSTED_CREATIVE_TABLES.brainTruth,
    title: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.title,
    canonicalText: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.canonicalText,
    canonicalTextForHumans:
      BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.canonicalTextForHumans,
    category: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.category,
    scope: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.scope,
    authority: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.authority,
    freshness: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.freshness,
    lastReviewed: BRAIN_TRUSTED_CREATIVE_TRUTH_FIELDS.lastReviewed,
  },
];

/**
 * Which Trusted table a draft is promoted into. Routed by the draft's brain;
 * the two brains live in separate bases with different field IDs. An unknown
 * brain falls back to Chapter 1, matching the existing promote default, unless
 * the caller overrides base and table from env.
 */
export function trustedRegistersForBrain(
  brainSlug: string,
): TrustedTruthRegisters {
  const slug = brainSlug.trim().toLowerCase();
  const match = TRUSTED_TRUTH_TABLES.find(
    (row) => row.brainSlug.toLowerCase() === slug,
  );
  return match ?? TRUSTED_TRUTH_TABLES[0];
}

/**
 * Resolve registers for a promote that may have base/table overridden by env.
 * When the override points at a table we do not have field IDs for, refuse
 * rather than write a name-keyed payload and lose the human register.
 */
export function trustedRegistersForTarget(input: {
  brainSlug: string;
  baseId: string;
  tableId: string;
}): TrustedTruthRegisters {
  const match = TRUSTED_TRUTH_TABLES.find(
    (row) => row.baseId === input.baseId && row.tableId === input.tableId,
  );
  if (match) return match;
  throw new Error(
    `No Trusted field-ID map for ${input.baseId}/${input.tableId}. Add it to trusted-truth-write.ts before promoting — a name-keyed write would drop the human register.`,
  );
}

/**
 * Promotion payload. Both registers travel; the human one is derived from the
 * agent text when the draft never carried its own (the old 126 rows).
 */
export function buildTrustedPromoteFields(input: {
  registers: TrustedTruthRegisters;
  title: string;
  canonicalTextForAgents: string;
  canonicalTextForHumans?: string;
  category: string;
  scope: string;
  authority: string;
  freshness?: string;
  lastReviewed: string;
}): Record<string, unknown> {
  const agentText = input.canonicalTextForAgents.trim();
  if (!agentText) {
    throw new Error("Trusted promote requires the agent register.");
  }
  const humanText =
    (input.canonicalTextForHumans ?? "").trim() || deriveHumanText(agentText);
  if (!humanText) {
    throw new Error("Trusted promote requires a human register.");
  }

  const f = input.registers;
  return {
    [f.title]: input.title.trim(),
    [f.canonicalText]: agentText,
    [f.canonicalTextForHumans]: humanText,
    [f.category]: input.category.trim(),
    [f.scope]: input.scope.trim(),
    [f.authority]: input.authority.trim(),
    [f.freshness]: input.freshness ?? "Current",
    [f.lastReviewed]: input.lastReviewed,
  };
}

export type TrustedBackfillRow = {
  recordId: string;
  /** Human register as it was before the write — blank, hence the fill. */
  before: string;
  after: string;
};

export type TrustedBackfillReport = {
  brainSlug: string;
  baseId: string;
  tableId: string;
  scanned: number;
  filled: number;
  /** Blank agent register too — nothing to derive from, left alone. */
  skippedEmptySource: number;
  /** Human register already populated — never overwritten. */
  skippedPopulated: number;
  rows: TrustedBackfillRow[];
};

/**
 * Fill blank Trusted human registers from each row's own Canonical Text.
 *
 * Deliberately narrow, because this is the one Red action in the job:
 * - reads and writes by field ID
 * - fills only where the human register is blank; never overwrites
 * - touches no other column (Freshness, Last Reviewed, Authority, Scope stay put)
 * - returns every row ID with its before-state so the fill can be undone
 *
 * `dryRun` reports what it would fill and writes nothing.
 */
export async function backfillTrustedHumanRegister(input: {
  registers: TrustedTruthRegisters;
  token: string;
  dryRun?: boolean;
}): Promise<TrustedBackfillReport> {
  const f = input.registers;
  const records = await airtableSelect(f.baseId, f.tableId, input.token, {
    fields: [f.canonicalText, f.canonicalTextForHumans],
    paginate: true,
    returnFieldsByFieldId: true,
  });

  const report: TrustedBackfillReport = {
    brainSlug: f.brainSlug,
    baseId: f.baseId,
    tableId: f.tableId,
    scanned: records.length,
    filled: 0,
    skippedEmptySource: 0,
    skippedPopulated: 0,
    rows: [],
  };

  for (const record of records) {
    const existingHuman = String(record.fields[f.canonicalTextForHumans] ?? "").trim();
    if (existingHuman) {
      report.skippedPopulated += 1;
      continue;
    }
    const agentText = String(record.fields[f.canonicalText] ?? "").trim();
    if (!agentText) {
      report.skippedEmptySource += 1;
      continue;
    }
    const humanText = deriveHumanText(agentText);
    if (!humanText) {
      report.skippedEmptySource += 1;
      continue;
    }

    if (!input.dryRun) {
      await airtableUpdate(f.baseId, f.tableId, input.token, record.id, {
        [f.canonicalTextForHumans]: humanText,
      });
    }
    report.filled += 1;
    report.rows.push({ recordId: record.id, before: "", after: humanText });
  }

  return report;
}
