import { NextResponse } from "next/server";
import { pausePlatformSession } from "@/lib/platform-activity/session-service";
import { readPlatformSessionHandle } from "@/lib/platform-activity/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { handle?: unknown };
    await pausePlatformSession(readPlatformSessionHandle(request, body.handle));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not pause platform session." },
      { status: 400 },
    );
  }
}
