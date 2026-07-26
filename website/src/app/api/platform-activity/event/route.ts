import { NextResponse } from "next/server";
import { createEnvelope } from "@/lib/platform-activity/envelope";
import { codeManifest } from "@/lib/platform-activity/manifest";
import {
  queuePlatformEnvelope,
  reservePlatformSequences,
} from "@/lib/platform-activity/session-service";
import { readPlatformSessionHandle } from "@/lib/platform-activity/signing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      handle?: unknown;
      eventType?: unknown;
      summary?: unknown;
      outcome?: unknown;
      source?: unknown;
      detail?: unknown;
    };
    const eventType = body.eventType === "Decision" ? "Decision" : "Action";
    const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 500) : "";
    if (!summary) throw new Error("summary is required.");

    const handle = readPlatformSessionHandle(request, body.handle);
    const { session, sequences } = await reservePlatformSequences(handle, 1);
    await queuePlatformEnvelope(
      createEnvelope({
        session,
        sequence: sequences[0],
        eventType,
        summary,
        model: "none",
        manifest: codeManifest({
          source: typeof body.source === "string" ? body.source : "platform-ui",
          promptVersion: "platform-ui-v1",
        }),
        outcome: typeof body.outcome === "string" ? body.outcome.slice(0, 120) : undefined,
        detail:
          body.detail && typeof body.detail === "object"
            ? (body.detail as Record<string, unknown>)
            : undefined,
      }),
    );
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not queue platform event." },
      { status: 400 },
    );
  }
}
