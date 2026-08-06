import { NextResponse } from "next/server";
import { get, head } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY read-only diagnostic (Kate, Living Folio Blob integration probe).
 * Reports ONLY booleans about whether the connected Vercel Blob store is
 * reachable from this deployment and which access mode its credentials
 * permit. Never returns env values, token values, store ids, or URLs.
 * No write, no upload. Removed after the probe.
 */
export async function GET() {
  const probePath = "platform-activity/leases/__blob_probe__.json";
  const result: {
    blobSdkReachable: boolean;
    privateRead: boolean;
    publicRead: boolean;
    note: string;
  } = {
    blobSdkReachable: false,
    privateRead: false,
    publicRead: false,
    note: "",
  };

  // Private read probe (matches the platform-activity lease seam pattern:
  // head(pathname) with no options object).
  try {
    await head(probePath);
    result.blobSdkReachable = true;
    result.privateRead = true;
  } catch {
    result.privateRead = false;
  }

  // Public read probe — a private-scoped credential rejects public access.
  try {
    await get(probePath, { access: "public", useCache: false });
    result.blobSdkReachable = true;
    result.publicRead = true;
  } catch {
    result.publicRead = false;
  }

  if (!result.blobSdkReachable) {
    result.note =
      "No Blob store reachable from this deployment (store not connected / OIDC or read-write token absent).";
  } else if (result.privateRead && !result.publicRead) {
    result.note =
      "Store connected; credentials are private-scoped (matches the platform-activity lease seam). A separate public store (or an authenticated proxy route) is required to serve the master image to the browser.";
  } else if (result.publicRead) {
    result.note =
      "Store connected and public access is permitted; the master image can be served directly from a Blob URL.";
  } else {
    result.note = "Store connected but neither access probe succeeded.";
  }

  return NextResponse.json(result);
}
