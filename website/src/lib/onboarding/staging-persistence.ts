/**
 * Persist Source Pack staging across reload so completed private uploads
 * remain re-attachable (simpler than inventing a server cleanup job).
 *
 * In-flight ("uploading") rows are dropped on restore — there is no File
 * handle to resume, and AbortController cannot survive a reload.
 */
import type { OnboardingState, SourcePackFile } from "./machine";

export const ONBOARDING_STAGING_KEY = "astrajax.onboarding.staging.v1";

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

/** Drop in-flight rows; keep uploaded + failed metadata. */
export function sanitizeRestoredFiles(files: SourcePackFile[]): SourcePackFile[] {
  return files
    .filter((f) => f.state === "uploaded" || f.state === "failed")
    .map((f) =>
      f.state === "uploaded"
        ? f
        : { ...f, error: f.error || "Upload interrupted — remove or pick again" },
    );
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
