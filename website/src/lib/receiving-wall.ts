/**
 * The Receiving Wall — Clive's Man's context-intake landing surface.
 *
 * The whole household's draft context arrives here, engraved into the living
 * wall. Three capture sources are distinguished by a tinted catch-light in the
 * incision; clicking a source zooms the frame into the wall to read and act on
 * that source's records in detail.
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
  /** Proposed destination brain slug, when known. */
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

/** Short legend for the wall's source key. */
export const CAPTURE_SOURCE_BLURB: Record<CaptureSource, string> = {
  external: "The context sentinel found this",
  "user-guided": "Someone asked for this to be recorded",
  chat: "Clive's Man reviewed a chat and recorded it",
};

/**
 * The catch-light tint inside each incision, per source. House palette:
 * sage (external), terracotta (user-guided), parchment (chat).
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
