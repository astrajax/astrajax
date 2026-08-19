/**
 * Persist Source Pack staging across reload so completed private uploads
 * remain re-attachable (simpler than inventing a server cleanup job).
 *
 * In-flight ("uploading") rows are dropped on restore — there is no File
 * handle to resume, and AbortController cannot survive a reload.
 */
import type { OnboardingState, SourcePackFile } from "./machine";

/** v2 adds Workshop filing state (`filing`, `filingError`, `sourceDocumentRecordId`). */
export const ONBOARDING_STAGING_KEY = "astrajax.onboarding.staging.v2";

type StagingSnapshot = {
  files: SourcePackFile[];
  supportingFile: SourcePackFile | null;
};

function isSourcePackFile(value: unknown): value is SourcePackFile {
  if (!value || typeof value !== "object") return false;
  const f = value as Partial<SourcePackFile>;
  return (
    typeof f.id === "string" &&
    typeof f.name === "string" &&
    typeof f.extension === "string" &&
    typeof f.sizeBytes === "number" &&
    (f.state === "selecting" ||
      f.state === "uploading" ||
      f.state === "uploaded" ||
      f.state === "failed")
  );
}

/**
 * Drop in-flight rows; keep uploaded + failed metadata. A filing that was still
 * in flight cannot have finished, so it is restored as retryable rather than
 * left looking like it was filed.
 */
export function sanitizeRestoredFiles(files: SourcePackFile[]): SourcePackFile[] {
  return files
    .filter((f) => f.state === "uploaded" || f.state === "failed")
    .map((f) => {
      if (f.state !== "uploaded") {
        return { ...f, error: f.error || "Upload interrupted — remove or pick again" };
      }
      if (f.filing !== "filing") return f;
      return {
        ...f,
        filing: "not-filed" as const,
        filingError: "Filing interrupted — retry to file it",
      };
    });
}

export function readOnboardingStaging(): Pick<OnboardingState, "files" | "supportingFile"> | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STAGING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StagingSnapshot>;
    const files = Array.isArray(parsed.files)
      ? sanitizeRestoredFiles(parsed.files.filter(isSourcePackFile))
      : [];
    const supportingRaw = parsed.supportingFile;
    const supportingFile =
      supportingRaw && isSourcePackFile(supportingRaw)
        ? sanitizeRestoredFiles([supportingRaw])[0] ?? null
        : null;
    return { files, supportingFile };
  } catch {
    return null;
  }
}

export function writeOnboardingStaging(
  snapshot: Pick<OnboardingState, "files" | "supportingFile">,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: StagingSnapshot = {
      files: snapshot.files,
      supportingFile: snapshot.supportingFile,
    };
    sessionStorage.setItem(ONBOARDING_STAGING_KEY, JSON.stringify(payload));
  } catch {
    // Private / quota — staging restore is best-effort.
  }
}
