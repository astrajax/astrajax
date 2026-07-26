import { NextResponse } from "next/server";
import { closePlatformSession } from "@/lib/platform-activity/session-service";
import { readPlatformSessionHandle } from "@/lib/platform-activity/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { handle?: unknown };
    const closed = await closePlatformSession(
      readPlatformSessionHandle(request, body.handle),
      "closed_by_user",
    );
    return NextResponse.json({ closed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not end platform session." },
      { status: 400 },
    );
  }
}
