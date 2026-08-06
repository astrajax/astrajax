import { getFolioAsset, type FolioAsset } from "./folio-assets";

/**
 * Resolve how the browser receives a Living Folio master, server-side.
 *
 * The connected store is PUBLIC (probe-confirmed 6 Aug 2026), so the master
 * is served directly from its Blob URL via next/image — no proxy route. The
 * full Blob URL is derived here from the store id held in env (never
 * hardcoded into the Git manifest), in the standard Vercel public-store
 * shape: https://<storeId>.public.blob.vercel-storage.com/<pathname>.
 */

export type ResolvedFolioAsset = {
  /** Blob URL to hand to next/image. */
  src: string;
  width: number;
  height: number;
  objectPosition: string;
  serve: FolioAsset["serve"];
};

/** Normalise a store id to its lowercase public-store host form. */
function publicStoreHost(storeId: string): string {
  return `${storeId.trim().toLowerCase()}.public.blob.vercel-storage.com`;
}

export function getFolioBlobPublicBase(): string | null {
  // FOLIO_BLOB_PUBLIC_BASE_URL wins when set (full override); otherwise the
  // base is derived from BLOB_STORE_ID (the connected public store id).
  const override = process.env.FOLIO_BLOB_PUBLIC_BASE_URL;
  if (override)
    return `https://${override.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) return null;
  return `https://${publicStoreHost(storeId)}`;
}

export function resolveFolioAsset(key: string): ResolvedFolioAsset | null {
  const asset = getFolioAsset(key);
  if (!asset) return null;
  const base = getFolioBlobPublicBase();
  if (!base) return null;
  return {
    src: `${base}/${asset.blobPathname}`,
    width: asset.width,
    height: asset.height,
    objectPosition: asset.objectPosition,
    serve: "url",
  };
}
