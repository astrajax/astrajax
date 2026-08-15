/**
 * The Receiving Wall — Clive's Man's context-intake landing surface.
 *
 * The whole household's draft context arrives here, engraved into the living
 * wall. The idle wall is three portals — doors into jobs, not kinds of truth:
 * judgement (work that needs a human), health (how the brains are), and
 * reports (this morning's written write-ups).
 *
 * Proposed Category still sorts inside pending drafts and still shows on the
 * opened letter. Capture Source remains provenance detail on the letter.
 * Neither is a top-level door.
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

/* ------------------------------------------------------------------ *
 * Operator portals v1 — the three doors on the idle wall.
 *
 * A "portal" is a door into a job, not a kind of truth. Proposed Category
 * still sorts inside the pending-drafts section and still shows on the opened
 * letter; it is no longer a top-level door.
 *
 * These are the stable shapes the wall UI imports. The API fills them; the
 * painted-world components render them.
 * ------------------------------------------------------------------ */

export type ReceivingPortalId = "judgement" | "health" | "reports";

export const RECEIVING_PORTAL_IDS: readonly ReceivingPortalId[] = [
  "judgement",
  "health",
  "reports",
] as const;

export function isReceivingPortalId(value: unknown): value is ReceivingPortalId {
  return (
    value === "judgement" || value === "health" || value === "reports"
  );
}

/**
 * A judgement-bay row that is not (yet) a Draft Brain Truth: Context Amendment
 * Versions that are Held or need a human, and this morning's V1 proposals.
 */
export interface ReceivingQueueItem {
  recordId: string;
  title: string;
  snippet: string;
  /** Proposing agent slug, or the pipe stage that wrote the row. */
  provenance: string;
  /** Why it is stuck, or why it was proposed. */
  reason?: string;
  /** Amendment stage — V1 (proposed) or V2 (challenged). */
  stage?: string;
  /** Challenger Verdict — Proposed / Cleared / Held / Rejected. */
  verdict?: string;
  /** Written report this row points at, when one exists. */
  reportUrl?: string;
  kind: "held" | "proposal";
}

/** A written report from Household Activity — the tip of the paper trail. */
export interface ReceivingReportLetter {
  recordId: string;
  title: string;
  reportType: string;
  agentSlug?: string;
  headline?: string;
  body: string;
  /** Human-readable period, e.g. "13 Aug 2026". */
  period?: string;
}

/**
 * How honest a bay is being. `live` read from Airtable, `derived` read but
 * partly inferred, `seed` a labelled stand-in so the wall is never blank.
 */
export type ReceivingBaySource = "live" | "derived" | "seed";

export interface ReceivingBayState {
  source: ReceivingBaySource;
  /** Operator-facing line when the bay is not fully live. */
  message?: string;
}

/** Per-portal honesty, so one dead token does not mislabel the whole wall. */
export type ReceivingPortalStates = Record<ReceivingPortalId, ReceivingBayState>;

/**
 * The whole idle wall in one payload. `records`, `source`, and `message` keep
 * the original single-bay contract working; the rest fills the new doors.
 */
export interface ReceivingWallPayload {
  records: ReceivingRecord[];
  held: ReceivingQueueItem[];
  proposals: ReceivingQueueItem[];
  reports: ReceivingReportLetter[];
  source: ReceivingBaySource;
  message?: string;
  portals: ReceivingPortalStates;
}

/** Pick the least-live source across bays — used for the top-level label. */
export function weakestBaySource(
  sources: readonly ReceivingBaySource[],
): ReceivingBaySource {
  if (sources.some((source) => source === "seed")) return "seed";
  if (sources.some((source) => source === "derived")) return "derived";
  return "live";
}

/**
 * Join the honesty lines for bays that share one door, without telling the
 * operator the same thing twice. Lines are written as `cause — effect`, so a
 * single missing token reads as one sentence with both effects rather than the
 * cause repeated per bay.
 */
export function mergeBayMessages(
  lines: readonly (string | undefined)[],
): string | undefined {
  const effectsByCause = new Map<string, string[]>();
  for (const line of lines) {
    const trimmed = line?.trim();
    if (!trimmed) continue;
    const split = trimmed.indexOf(" — ");
    const cause = split > 0 ? trimmed.slice(0, split) : trimmed;
    // Drop each effect's full stop so two of them can share one sentence.
    const effect =
      split > 0 ? trimmed.slice(split + 3).trim().replace(/\.$/, "") : "";
    const effects = effectsByCause.get(cause) ?? [];
    if (effect && !effects.includes(effect)) effects.push(effect);
    effectsByCause.set(cause, effects);
  }
  if (effectsByCause.size === 0) return undefined;
  return [...effectsByCause]
    .map(([cause, effects]) =>
      effects.length > 0 ? `${cause} — ${effects.join("; ")}.` : cause,
    )
    .join(" ");
}

/**
 * Operator-facing period line for a report letter. Single date when start and
 * end match (or only one is set); a range otherwise.
 */
export function formatReportPeriod(
  periodStart?: string,
  periodEnd?: string,
): string | undefined {
  const start = formatReportDate(periodStart);
  const end = formatReportDate(periodEnd);
  if (start && end) return start === end ? start : `${start} – ${end}`;
  return end ?? start;
}

function formatReportDate(value?: string): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  const parsed = new Date(raw.length === 10 ? `${raw}T00:00:00Z` : raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

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
