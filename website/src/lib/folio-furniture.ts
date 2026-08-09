/**
 * Living Folio — furniture plate manifest (Git-side, small manifest).
 *
 * The docket-plate bank is served from the connected public Vercel Blob store
 * (folder `docket-plate-blob/`), NOT from Git-resident assets. This manifest
 * registers each plate's logical key, source SHA-256, pixel dimensions, MIME,
 * and Blob pathname. The full Blob URL is derived server-side from the store
 * id (bare public host, no "store_" prefix) — never hardcoded here.
 *
 * These are the working-resolution transparent (RGBA) plates. The high-res
 * masters are the canonical originals (see folio-assets.ts / Blob masters).
 */

export type FurniturePlate = {
  key: string;
  sourceName: string;
  sourceSha256: string;
  width: number;
  height: number;
  mime: string;
  version: number;
  blobPathname: string;
};

const STORE_ID = "store_cvu4L5KwtlOCutGD";

function publicBlobHost(storeId: string): string {
  return `${storeId.trim().toLowerCase().replace(/^store_/, "")}.public.blob.vercel-storage.com`;
}

/** Full public Blob URL for a furniture plate pathname. */
export function furniturePlateUrl(blobPathname: string): string {
  return `https://${publicBlobHost(STORE_ID)}/${blobPathname
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export const DOCKET_PLATES: Record<string, FurniturePlate> = {
  "docket-frame-button": {
    key: "docket-frame-button",
    sourceName: "docket-frame-button.png",
    sourceSha256: "f32b23432a645d81e44a29ab48290b9344a1ec8604c069e5055ebeb41643701d",
    width: 560,
    height: 350,
    mime: "image/png",
    version: 1,
    blobPathname: "docket-plate-blob/docket-frame-button.png",
  },
  "docket-frame-slim": {
    key: "docket-frame-slim",
    sourceName: "docket-frame-slim.png",
    sourceSha256: "5cc5fc2d46c6263658ccb15d4d4d999d4596eeaa06d524d4df727c69e6d8e556",
    width: 760,
    height: 201,
    mime: "image/png",
    version: 1,
    blobPathname: "docket-plate-blob/docket-frame-slim.png",
  },
  "docket-plate-long": {
    key: "docket-plate-long",
    sourceName: "docket-plate-long.png",
    sourceSha256: "ed58b71e2530da4cd91391a01c2b2e882219198b7180463c89d9c2c0217f2d86",
    width: 820,
    height: 182,
    mime: "image/png",
    version: 1,
    blobPathname: "docket-plate-blob/docket-plate-long.png",
  },
  "docket-plate-medium": {
    key: "docket-plate-medium",
    sourceName: "docket-plate-medium.png",
    sourceSha256: "fe23b887ec7298ae1e201d81a5ae9f5cdae44863adb98099ed71a7a274d58774",
    width: 560,
    height: 338,
    mime: "image/png",
    version: 1,
    blobPathname: "docket-plate-blob/docket-plate-medium.png",
  },
  "docket-plate-short": {
    key: "docket-plate-short",
    sourceName: "docket-plate-short.png",
    sourceSha256: "de99bc31be8b417c945a9217346e57fcba798c9b0f9863869b37c40b26fdfcf8",
    width: 420,
    height: 223,
    mime: "image/png",
    version: 1,
    blobPathname: "docket-plate-blob/docket-plate-short.png",
  },
};

export function getFurniturePlate(key: string): FurniturePlate | null {
  return DOCKET_PLATES[key] ?? null;
}
