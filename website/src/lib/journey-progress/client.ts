"use client";

/**
 * Fire-and-forget journey progress sync. localStorage stays the fast local
 * ledger (see user-brain-intake.ts); this mirrors each step to the server
 * so progress survives device and browser changes (§2). Silent on 401 —
 * anonymous visitors simply aren't recorded.
 */

let lastSynced = "";

export function syncJourneyProgress(input: {
  chapter: 1 | 2 | 3;
  step: string;
  book?: string | null;
}): void {
  const signature = `${input.chapter}:${input.step}:${input.book ?? ""}`;
  if (signature === lastSynced) return;
  lastSynced = signature;
  void fetch("/api/journey/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapter: input.chapter,
      step: input.step,
      book: input.book ?? undefined,
    }),
    keepalive: true,
  }).catch(() => {
    lastSynced = ""; // let a later step retry
  });
}
