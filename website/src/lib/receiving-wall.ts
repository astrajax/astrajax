/**
 * The Receiving Wall — Clive's Man's context-intake landing surface.
 *
 * The whole household's draft context arrives here, engraved into the living
 * wall. Drafts group by Proposed Category (Airtable single-select). Capture
 * Source remains provenance detail on the opened letter — not the wall's
 * organising principle.
 */

export type CaptureSource = "external" | "user-guided" | "chat";

export interface ReceivingRecord {
  recordId: string;
  title: string;
  /** Short read of the record — never the canonical body on the wall. */
  snippet: string;
  /** Provenance detail, e.g. the proposing agent or interface. */
  provenance: string;
  captureSource: CaptureSource;
  /**
   * Proposed Category from Airtable (single-select). Empty/missing →
   * uncategorised bucket on the wall.
   */
  category?: string;
  /** System Brain display name from Brain Registry lookup — letter. */
  systemBrainName?: string;
  /** System Brain slug from Brain Registry lookup (legacy Brain Slug fallback). */
  systemBrainSlug?: string;
  /** Proposed destination brain slug, when known (legacy text field). */
  brainSlug?: string;
  status?: string;
  /** Canonical text — only revealed when the record's letter is opened. */
  canonicalText?: string;
}

export const CAPTURE_SOURCE_LABEL: Record<CaptureSource, string> = {
  external: "External Context Capture",
  "user-guided": "User Guided Capture",
  chat: "Chat Session",
};

/** Short legend for capture-source provenance (letter / detail). */
export const CAPTURE_SOURCE_BLURB: Record<CaptureSource, string> = {
  external: "The context sentinel found this",
  "user-guided": "Someone asked for this to be recorded",
  chat: "Clive's Man reviewed a chat and recorded it",
};

/**
 * Subtle catch-light for Capture Source provenance (letter / row accent).
 * Wall plaques use category tints instead.
 */
export const CAPTURE_SOURCE_TINT: Record<CaptureSource, string> = {
  external: "#9aa77a",
  "user-guided": "#d77545",
  chat: "#e7d1ad",
};

export const CAPTURE_SOURCE_ORDER: CaptureSource[] = [
  "external",
  "user-guided",
  "chat",
];

/**
 * Sentinel key for drafts with no Proposed Category. Not an Airtable choice —
 * UI/routing only.
 */
export const RECEIVING_UNCATEGORISED_KEY = "__uncategorised__";

/**
 * Canonical Proposed Category order — matches the Workshop single-select
 * choice order (live Draft counts checked 2026-08).
 */
export const RECEIVING_CATEGORY_ORDER = [
  "Business Definition",
  "Positioning",
  "Method",
  "Offers",
  "Proof",
  "Workflow Rule",
  "Governance",
  "Goals & Priorities",
  "Definition",
  "Open Questions",
] as const;

export type ReceivingCategory = (typeof RECEIVING_CATEGORY_ORDER)[number];

const KNOWN_CATEGORY_SET = new Set<string>(RECEIVING_CATEGORY_ORDER);

/**
 * Working plaque tints — muted variants of the house family
 * (sage / terracotta / parchment). Kathryn owns final taste; do not treat as
 * finished art direction.
 */
export const RECEIVING_CATEGORY_TINT: Record<string, string> = {
  "Business Definition": "#9aa77a",
  Positioning: "#8f9b72",
  Method: "#d77545",
  Offers: "#c86a3f",
  Proof: "#e7d1ad",
  "Workflow Rule": "#a3af84",
  Governance: "#b86842",
  "Goals & Priorities": "#d4c09a",
  Definition: "#7f8c68",
  "Open Questions": "#e08a58",
  [RECEIVING_UNCATEGORISED_KEY]: "#b8a88a",
};

/** Fallback tint for unknown/new category strings not in the map. */
const UNKNOWN_CATEGORY_TINT = "#c4b49a";

/**
 * Optional one-line neutrals only — no invented doctrine. Missing blurb →
 * UI shows the category name alone.
 */
export const RECEIVING_CATEGORY_BLURB: Partial<Record<string, string>> = {
  [RECEIVING_UNCATEGORISED_KEY]: "No Proposed Category set yet",
};

export function receivingCategoryKey(
  record: Pick<ReceivingRecord, "category">,
): string {
  const raw = record.category?.trim();
  return raw ? raw : RECEIVING_UNCATEGORISED_KEY;
}

export function receivingCategoryLabel(key: string): string {
  if (key === RECEIVING_UNCATEGORISED_KEY) return "Uncategorised";
  return key;
}

export function receivingCategoryBlurb(key: string): string | undefined {
  const blurb = RECEIVING_CATEGORY_BLURB[key]?.trim();
  return blurb || undefined;
}

export function receivingCategoryTint(key: string): string {
  return RECEIVING_CATEGORY_TINT[key] ?? UNKNOWN_CATEGORY_TINT;
}

/**
 * Categories that have at least one record, in display order:
 * canonical choices → unknown/new strings (sorted) → uncategorised last.
 */
export function listPopulatedReceivingCategories(
  records: ReceivingRecord[],
): string[] {
  const present = new Set(records.map(receivingCategoryKey));
  const known = RECEIVING_CATEGORY_ORDER.filter((category) => present.has(category));
  const unknown = [...present]
    .filter(
      (key) => key !== RECEIVING_UNCATEGORISED_KEY && !KNOWN_CATEGORY_SET.has(key),
    )
    .sort((a, b) => a.localeCompare(b));
  const ordered = [...known, ...unknown];
  if (present.has(RECEIVING_UNCATEGORISED_KEY)) {
    ordered.push(RECEIVING_UNCATEGORISED_KEY);
  }
  return ordered;
}

/** Status values that mean the human has already acted on the Receiving Wall. */
export const RECEIVING_WALL_ACCEPTED_STATUSES = new Set([
  "Approved",
  "Promoted",
  "Quarantined",
  "Rejected",
]);

/**
 * Whether a Receiving Wall record has already been acted on.
 *
 * `customAcceptStatus` must be passed from a Server Component (or other
 * server-resolved source) when this runs in the browser — the env var is
 * server-only and is not available under `process.env` on the client.
 * On the server, omitting it falls back to BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS.
 */
export function isReceivingRecordActioned(
  status?: string,
  customAcceptStatus: string | undefined = process.env
    .BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS,
): boolean {
  if (!status?.trim()) return false;
  const normalized = status.trim();
  if (RECEIVING_WALL_ACCEPTED_STATUSES.has(normalized)) return true;
  const customAccept = customAcceptStatus?.trim();
  return Boolean(customAccept && normalized === customAccept);
}
