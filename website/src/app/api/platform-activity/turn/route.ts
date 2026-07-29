import { NextResponse } from "next/server";
import { createEnvelope } from "@/lib/platform-activity/envelope";
import { codeManifest } from "@/lib/platform-activity/manifest";
import {
  queuePlatformEnvelope,
  reservePlatformSequences,
} from "@/lib/platform-activity/session-service";
import { readPlatformSessionHandle } from "@/lib/platform-activity/signing";
import { readTurnId } from "@/lib/platform-activity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      handle?: unknown;
      surface?: unknown;
      persona?: unknown;
      brainSlug?: unknown;
      userMessage?: unknown;
      assistantReply?: unknown;
      outcome?: unknown;
      source?: unknown;
      promptVersion?: unknown;
    };
    const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : "";
    const assistantReply =
      typeof body.assistantReply === "string" ? body.assistantReply.trim() : "";
    if (!userMessage || !assistantReply) {
      throw new Error("userMessage and assistantReply are required.");
    }
    const handle = readPlatformSessionHandle(request, body.handle);
    const turnId = readTurnId(request);
    const { session, sequences } = await reservePlatformSequences(handle, 1);
    await queuePlatformEnvelope(
      createEnvelope({
        session,
        sequence: sequences[0],
        eventId: `evt-platform-${session.publicSessionId}-turn-${turnId}`,
        eventType: "Turn",
        summary: `${typeof body.surface === "string" ? body.surface : "platform"} exchange`,
        model: "none",
        manifest: codeManifest({
          source: typeof body.source === "string" ? body.source : "code-grounded",
          promptVersion:
            typeof body.promptVersion === "string" ? body.promptVersion : "code-grounded-v1",
        }),
        userMessage,
        replyDigest: assistantReply,
        outcome: typeof body.outcome === "string" ? body.outcome : "Completed",
        detail: {
          turnId,
          surface: typeof body.surface === "string" ? body.surface : "platform",
          persona: typeof body.persona === "string" ? body.persona : "clive",
          brainSlug: typeof body.brainSlug === "string" ? body.brainSlug : undefined,
          scripted: true,
        },
      }),
    );
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not queue platform turn." },
      { status: 400 },
    );
  }
}
