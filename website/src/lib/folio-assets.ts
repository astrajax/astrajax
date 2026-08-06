/**
 * Living Folio — painted-scene asset manifest (Git-side, the small manifest,
 * never the multi-MB master).
 *
 * The Living Folio background master (living-folio-empty-4k.png, 3840×2560,
 * 3:2) is stored in the connected Vercel Blob store at full resolution — Git
 * holds only this logical-key → Blob-pointer manifest. The master is the
 * visual source of truth; no Git-resident derivative is canonical. The
 * temporary SVG data-URI derivative committed during the integration
 * (living-folio-master-2048.svg) is a stopgap fallback ONLY and is retired
 * once the Blob-backed route is live.
 *
 * Blob access (public vs private) and the exact Blob URL are resolved at
 * request time, server-side, after the store connection probe — never baked
 * here. When the connected store is private-scoped, `serve: "proxy"` and the
 * master streams through /api/folio-asset (authenticated OIDC read); when
 * public, `serve: "url"` and next/image reads the Blob URL directly.
 */

export type FolioAssetServe = "proxy" | "url";

export type FolioAsset = {
  /** Stable logical key referenced by components. */
  key: string;
  /** Human/source filename (not necessarily the Blob pathname). */
  sourceName: string;
  /** SHA-256 of the canonical source bytes. */
  sourceSha256: string;
  /** Pixel dimensions of the canonical source. */
  width: number;
  height: number;
  /** Aspect as a reduced ratio string, e.g. "3:2". */
  aspect: string;
  mime: string;
  /** Monotonic content version; bump when the master is re-cut. */
  version: number;
  /** CSS object-position used when the frame crops the full composition. */
  objectPosition: string;
  /** How the browser receives the bytes (see header note). */
  serve: FolioAssetServe;
  /**
   * Blob pathname (logical key within the store). The full Blob URL is
   * derived server-side from the connected store at request time.
   */
  blobPathname: string;
};

export const LIVING_FOLIO_MASTER: FolioAsset = {
  key: "living-folio.master",
  sourceName: "living-folio-empty-4k.png",
  sourceSha256:
    "39cfec191f69f73ca5933eab16f26b9e634cd9f152cdf29d8a208668ffc07212",
  width: 3840,
  height: 2560,
  aspect: "3:2",
  mime: "image/png",
  version: 1,
  objectPosition: "center",
  serve: "url",
  blobPathname: "folio/living-folio-empty-4k.png",
};

export function getFolioAsset(key: string): FolioAsset | null {
  return key === LIVING_FOLIO_MASTER.key ? LIVING_FOLIO_MASTER : null;
}
