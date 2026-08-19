/**
 * Shared guard for onboarding upload keys.
 *
 * Both the token-minting route and the Workshop filing route must agree that a
 * pathname is a real onboarding staging key. Anything outside
 * `onboarding-uploads/` is refused so neither route can be pointed at an
 * arbitrary blob.
 */
import { SOURCE_PACK_LIMITS } from "./machine";

export function assertOnboardingUploadPathname(pathname: string): void {
  const prefix = SOURCE_PACK_LIMITS.uploadPrefix;
  if (
    !pathname.startsWith(prefix) ||
    pathname.includes("..") ||
    pathname.includes("//")
  ) {
    throw new Error(`Uploads must use the ${prefix} prefix`);
  }
  const rest = pathname.slice(prefix.length);
  if (!rest || rest.includes("/")) {
    throw new Error("Invalid upload pathname");
  }
}

/**
 * Reduce a blob URL (or a bare pathname) to its store key, then assert it is an
 * onboarding staging key. Absolute URLs are only accepted for their pathname —
 * the host is never trusted or fetched directly.
 */
export function toOnboardingUploadPathname(urlOrPathname: string): string {
  const trimmed = urlOrPathname.trim();
  if (!trimmed) throw new Error("url or pathname required");

  let pathname = trimmed;
  if (trimmed.includes("://")) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("Invalid upload pathname");
    }
    pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  }

  assertOnboardingUploadPathname(pathname);
  return pathname;
}

export function onboardingUploadExtension(pathname: string): string {
  const idx = pathname.lastIndexOf(".");
  return idx >= 0 ? pathname.slice(idx).toLowerCase() : "";
}

export function assertOnboardingUploadExtension(pathname: string): void {
  const ext = onboardingUploadExtension(pathname);
  if (!(SOURCE_PACK_LIMITS.allowedExtensions as readonly string[]).includes(ext)) {
    throw new Error(`File type not allowed: ${ext || "(none)"}`);
  }
}
