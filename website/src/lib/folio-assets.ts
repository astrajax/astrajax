/**
 * Living Folio — painted-scene asset manifest (Git-side, the small manifest,
 * never the multi-MB master).
 *
 * Canonical production master: Kathryn's TRUE 16:9 edge-to-edge Living Folio
 * ("Living Folio wide 16_9 edge-to-edge.png", 5504×3072) — walnut frame
 * edge-to-edge on all sides (top rail, bottom leather, extended left/right),
 * supplied after the 3:2 contain/art-canvas treatment with flat sidebars was
 * rejected. Served full-bleed object-fit:cover from the connected public
 * Vercel Blob store via next/image — no crop decision, stretch, letterbox,
 * flat bars or shrinking: the master IS the viewport aspect.
 *
 * Git holds only this logical-key → Blob-pointer manifest; the master itself
 * lives in Blob at full resolution. The earlier 3:2 master
 * (living-folio-empty-4k.png) remains in Blob but is NOT selected live; the
 * Git SVG data-URI derivative (living-folio-master-2048.svg) is a stopgap
 * fallback only, not canonical.
 */

export type FolioAssetServe = "url";

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
  /** Aspect as a reduced ratio string, e.g. "16:9". */
  aspect: string;
  mime: string;
  /** Monotonic content version; bump when the master is re-cut. */
  version: number;
  /** CSS object-position used when the frame crops the full composition. */
  objectPosition: string;
  /** How the browser receives the bytes (public Blob URL). */
  serve: FolioAssetServe;
  /** Blob pathname (logical key within the store). */
  blobPathname: string;
};

export const LIVING_FOLIO_MASTER: FolioAsset = {
  key: "living-folio.master",
  sourceName: "Living Folio wide 16_9 edge-to-edge.png",
  sourceSha256:
    "58adaf8ac68a30fc181e1116dbff696fb8f26bbe53068486504eae9f262a5acf",
  width: 5504,
  height: 3072,
  aspect: "16:9",
  mime: "image/png",
  version: 2,
  objectPosition: "center",
  serve: "url",
  blobPathname: "folio/Living Folio wide 16_9 edge-to-edge.png",
};

export function getFolioAsset(key: string): FolioAsset | null {
  return key === LIVING_FOLIO_MASTER.key ? LIVING_FOLIO_MASTER : null;
}
