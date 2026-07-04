import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Journey is not public — clip proxy disabled. Restore blob handler when re-enabling /journey. */
export async function GET() {
  return new NextResponse("Not found", { status: 404 });
}
