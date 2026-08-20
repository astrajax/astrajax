/**
 * File an onboarding upload into Workshop Source Documents.
 *
 * Private Blob is upload staging only; Airtable Workshop **Source Documents**
 * is the durable home. The browser uploads bytes straight to Blob, then calls
 * this handler with the staging key. The server never streams those bytes
 * through Next.js: it mints a short-lived signed GET URL for the private
 * staging object and asks Airtable to fetch and attach it. After the record
 * shows an attachment, staging is deleted.
 *
 * Deliberately NOT done here: mining, setting Mine Status to Summarised, or any
 * Trusted Brain write. A filed row is evidence awaiting a human, nothing more.
 */
import { del, head, issueSignedToken, presignUrl } from "@vercel/blob";
import {
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { airtableAttachFromUrl, airtableCreate } from "../airtable-rest";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import { SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES } from "./source-document-mine";
import { createMemorySourceDocument } from "./source-document-memory";

export const ONBOARDING_SOURCE_DOCUMENT_DEFAULTS = {
  brainSlug: "astrajax-chapter-1",
  /** Matches the Source Documents `Created By` single-select option. */
  createdBy: "Website",
  mineStatus: BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.pending,
} as const;

const ATTACHMENT_FIELD_NAME = "Attachment";

/** Long enough for Airtable to finish GETting up to ~20 MB from Blob. */
const STAGING_SIGNED_GET_TTL_MS = 12 * 60 * 1000;

export type OnboardingSourceDocumentBody = {
  /** Blob URL or staging pathname returned by the client upload. */
  blobUrl?: string;
  pathname?: string;
  /** Original filename — becomes the row Title. */
  filename?: string;
  brainSlug?: string;
  /** Existing row to attach to (retry after a failed attachment). */
  recordId?: string;
};

export type OnboardingSourceDocumentResult = {
  mode: "airtable" | "memory" | "fallback";
  /** True only when the file is durably filed with its attachment. */
  saved: boolean;
  recordId?: string;
  /** True while the staged blob still exists and a retry is possible. */
  blobRetained: boolean;
  message?: string;
};

function titleFromPathname(pathname: string): string {
  const key = pathname.slice(pathname.lastIndexOf("/") + 1);
  return key || "Untitled upload";
}

function isRecordId(value: string | undefined): value is string {
  return typeof value === "string" && /^rec[a-zA-Z0-9]{10,}$/.test(value);
}

function blobTokenOptions(): { token: string } | Record<string, never> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token ? { token } : {};
}

/**
 * Confirm the staging object still exists without pulling the body into memory.
 */
async function assertStagedBlobExists(pathname: string): Promise<void> {
  try {
    await head(pathname, blobTokenOptions());
  } catch {
    throw new Error("Staged upload is no longer available. Upload the file again.");
  }
}

/**
 * Mint a short-lived private GET URL scoped to this staging key so Airtable
 * can fetch the file without making the Blob store public.
 */
async function mintStagingGetUrl(pathname: string): Promise<string> {
  const validUntil = Date.now() + STAGING_SIGNED_GET_TTL_MS;
  const signedToken = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil,
    ...blobTokenOptions(),
  });
  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "get",
    pathname,
    access: "private",
    validUntil,
  });
  return presignedUrl;
}

async function deleteStagedBlob(pathname: string): Promise<boolean> {
  try {
    await del(pathname, blobTokenOptions());
    return true;
  } catch {
    // Airtable already holds the durable copy; a surviving staging blob is a
    // tidy-up problem, not a filing failure.
    return false;
  }
}

/**
 * @param pathname Already validated as an `onboarding-uploads/` staging key by
 * the caller (the route owns that guard so arbitrary URLs never reach here).
 */
export async function handleOnboardingSourceDocument(
  pathname: string,
  body: OnboardingSourceDocumentBody = {},
): Promise<OnboardingSourceDocumentResult> {
  const brainSlug =
    body.brainSlug?.trim() || ONBOARDING_SOURCE_DOCUMENT_DEFAULTS.brainSlug;
  const title = body.filename?.trim() || titleFromPathname(pathname);

  if (useMemoryStore()) {
    const row = createMemorySourceDocument({ documentTitle: title, brainSlug });
    return {
      mode: "memory",
      saved: true,
      recordId: row.recordId,
      blobRetained: true,
      message:
        "Local memory store — filed as a Pending source document stand-in, not in Airtable.",
    };
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_SOURCE_DOCUMENTS_TABLE_ID ??
    BRAIN_WORKSHOP_TABLES.sourceDocuments;

  if (!workshopBaseId || !workshopToken || !tableId) {
    return {
      mode: "fallback",
      saved: false,
      blobRetained: true,
      message:
        "Workshop Source Documents not wired (BRAIN_WORKSHOP_WRITE_TOKEN). The file stays in upload staging only.",
    };
  }

  await assertStagedBlobExists(pathname);

  // Retry path: attach to the row created by an earlier attempt rather than
  // filing the same file twice.
  const recordId = isRecordId(body.recordId)
    ? body.recordId
    : (
        await airtableCreate(workshopBaseId, tableId, workshopToken, {
          [SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.title]: title,
          [SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.mineStatus]:
            ONBOARDING_SOURCE_DOCUMENT_DEFAULTS.mineStatus,
          [SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.brainSlug]: brainSlug,
          "Created By": ONBOARDING_SOURCE_DOCUMENT_DEFAULTS.createdBy,
        })
      ).id;

  let presignedUrl: string;
  try {
    presignedUrl = await mintStagingGetUrl(pathname);
  } catch (error) {
    return {
      mode: "airtable",
      saved: false,
      recordId,
      blobRetained: true,
      message: `Could not mint a temporary download link for Airtable: ${
        error instanceof Error ? error.message : "unknown error"
      }. The file stays in upload staging — retry filing.`,
    };
  }

  try {
    await airtableAttachFromUrl(
      workshopBaseId,
      tableId,
      recordId,
      ATTACHMENT_FIELD_NAME,
      workshopToken,
      { url: presignedUrl, filename: title },
    );
  } catch (error) {
    // The row exists but carries no evidence yet. Keep the staging blob and
    // hand the record id back so a retry attaches instead of duplicating.
    return {
      mode: "airtable",
      saved: false,
      recordId,
      blobRetained: true,
      message: `Source document row created but the attachment did not upload: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    };
  }

  // Airtable now holds the durable copy. Delete staging so one file does not
  // live permanently in two places; deletion only ever happens after a
  // confirmed attachment, so failures always leave a retryable blob behind.
  const deleted = await deleteStagedBlob(pathname);

  return {
    mode: "airtable",
    saved: true,
    recordId,
    blobRetained: !deleted,
  };
}
