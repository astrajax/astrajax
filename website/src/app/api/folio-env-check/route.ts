import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY: reports only whether BLOB_STORE_ID is present at runtime. No value. */
export async function GET() {
  return NextResponse.json({ blobStoreIdPresent: Boolean(process.env.BLOB_STORE_ID) });
}
