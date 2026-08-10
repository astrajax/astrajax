import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { initialOperatorState } from "@/lib/platform/operator-state";
import { memoryOperatorStore } from "@/lib/platform/operator-store/memory-store";
import { GET, POST } from "./route";

const authMock = vi.mocked(auth);

beforeEach(() => {
  process.env.OPERATOR_STATE_USE_MEMORY = "true";
  memoryOperatorStore.resetForTests?.();
  authMock.mockReset();
});

afterEach(() => {
  memoryOperatorStore.resetForTests?.();
  delete process.env.OPERATOR_STATE_USE_MEMORY;
});

async function signedInAs(operatorId: string) {
  authMock.mockResolvedValue({
    operator: { operatorId, email: "matthew@example.com", role: "owner" },
  } as never);
  await memoryOperatorStore.create(
    initialOperatorState({
      operatorId,
      email: "matthew@example.com",
      now: "2026-08-05T10:00:00.000Z",
    }),
  );
}

describe("POST /api/journey/progress", () => {
  it("returns 401 when there is no verified operator session", async () => {
    authMock.mockResolvedValue(null as never);
    const res = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        body: JSON.stringify({ chapter: 1, step: "start" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects invalid chapter and empty/oversized step", async () => {
    await signedInAs("op_matthew");

    const badChapter = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        body: JSON.stringify({ chapter: 9, step: "start" }),
      }),
    );
    expect(badChapter.status).toBe(400);

    const emptyStep = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        body: JSON.stringify({ chapter: 1, step: "   " }),
      }),
    );
    expect(emptyStep.status).toBe(400);

    const longStep = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        body: JSON.stringify({ chapter: 1, step: "x".repeat(201) }),
      }),
    );
    expect(longStep.status).toBe(400);
  });

  it("returns 409 when the operator has no state record (recovery, not invent)", async () => {
    authMock.mockResolvedValue({
      operator: { operatorId: "op_missing", email: "x@y.com", role: "owner" },
    } as never);

    const res = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        body: JSON.stringify({ chapter: 1, step: "start" }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it("persists chapter-1 book resume URLs and clears the chapter from completedChapters", async () => {
    await signedInAs("op_matthew");
    const existing = await memoryOperatorStore.getById("op_matthew");
    await memoryOperatorStore.put({
      ...existing!,
      journey: { chapter: 1, step: "start", completedChapters: [1] },
    });

    const res = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapter: 1, step: "draft-truths", book: "the-ledger" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      resumeUrl: string;
      journey: { chapter: number; step: string; completedChapters: number[] };
    };
    expect(body.ok).toBe(true);
    expect(body.resumeUrl).toBe("/chapter-1?book=the-ledger&resume=1");
    expect(body.journey).toEqual({
      chapter: 1,
      step: "draft-truths",
      completedChapters: [],
    });

    const stored = await memoryOperatorStore.getById("op_matthew");
    expect(stored?.lastSafeDestination).toBe("/chapter-1?book=the-ledger&resume=1");
    expect(stored?.journey?.step).toBe("draft-truths");
  });

  it("uses the generic chapter path when no book is supplied", async () => {
    await signedInAs("op_matthew");
    const res = await POST(
      new Request("https://example.com/api/journey/progress", {
        method: "POST",
        body: JSON.stringify({ chapter: 2, step: "mine-sources" }),
      }),
    );
    const body = (await res.json()) as { resumeUrl: string };
    expect(res.status).toBe(200);
    expect(body.resumeUrl).toBe("/chapter-2?step=mine-sources");
  });
});

describe("GET /api/journey/progress", () => {
  it("returns 401 when unsigned", async () => {
    authMock.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the operator's journey and resume URL", async () => {
    await signedInAs("op_matthew");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      journey: { chapter: 1, step: "start", completedChapters: [] },
      resumeUrl: "/chapter-1?book=welcome",
    });
  });
});
