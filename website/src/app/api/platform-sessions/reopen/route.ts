import { NextResponse } from "next/server";
import { reopenPlatformSession } from "@/lib/platform-activity/session-service";
import { readPlatformSessionHandle } from "@/lib/platform-activity/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { handle?: unknown };
    const outcome = await reopenPlatformSession(readPlatformSessionHandle(request, body.handle));
    return NextResponse.json({ outcome }, { status: outcome === "timed_out" ? 410 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reopen platform session." },
      { status: 400 },
    );
  }
}
