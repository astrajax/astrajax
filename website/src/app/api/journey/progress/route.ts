import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { journeyPath } from "@/lib/platform/enter-routing";
import type { JourneyChapter } from "@/lib/platform/operator-state";
import { getOperatorStore } from "@/lib/platform/operator-store/get-store";

export const dynamic = "force-dynamic";

/**
 * Journey progress writes — server-side per the state contract (§2, §5).
 * The chapter surfaces call this as steps advance; localStorage remains an
 * accelerator only. Anonymous calls 401: an unauthenticated visitor's
 * chapter-1 wander is a marketing experience, not journey state.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  const operatorId = session?.operator?.operatorId;
  if (!operatorId) {
    return NextResponse.json({ error: "Sign in to record progress." }, { status: 401 });
  }

  let body: { chapter?: number; step?: string; book?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const chapter = body.chapter;
  const step = typeof body.step === "string" ? body.step.trim() : "";
  if (chapter !== 1 && chapter !== 2 && chapter !== 3) {
    return NextResponse.json({ error: "chapter must be 1, 2, or 3." }, { status: 400 });
  }
  if (!step || step.length > 200) {
    return NextResponse.json({ error: "step is required (≤200 chars)." }, { status: 400 });
  }

  const store = getOperatorStore();
  const state = await store.getById(operatorId);
  if (!state) {
    // /enter will surface this as its recovery case; don't invent a record here.
    return NextResponse.json({ error: "No operator state on record." }, { status: 409 });
  }

  const completedChapters = state.journey?.completedChapters ?? [];
  // The chapter surface knows its own step grammar; the server records the
  // resume URL it should reopen at. Chapter 1 resumes by book.
  const book = typeof body.book === "string" && body.book.trim() ? body.book.trim() : null;
  const resumeUrl =
    chapter === 1 && book
      ? `/chapter-1?book=${encodeURIComponent(book)}&resume=1`
      : journeyPath(chapter, step);

  const next = await store.put({
    ...state,
    journey: {
      chapter: chapter as JourneyChapter,
      step,
      completedChapters: completedChapters.filter((c) => c !== chapter),
    },
    lastSafeDestination: resumeUrl,
  });

  return NextResponse.json({
    ok: true,
    journey: next.journey,
    resumeUrl,
  });
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const operatorId = session?.operator?.operatorId;
  if (!operatorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const state = await getOperatorStore().getById(operatorId);
  return NextResponse.json({
    journey: state?.journey ?? null,
    resumeUrl: state?.lastSafeDestination ?? null,
  });
}
