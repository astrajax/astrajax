import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initialOperatorState } from "../operator-state";
import { memoryOperatorStore } from "./memory-store";

const email = "Matthew@AstraJax.com";

function seed(operatorId = "op_matthew") {
  return memoryOperatorStore.create(
    initialOperatorState({
      operatorId,
      email,
      now: "2026-08-05T10:00:00.000Z",
    }),
  );
}

beforeEach(() => {
  memoryOperatorStore.resetForTests?.();
});

afterEach(() => {
  memoryOperatorStore.resetForTests?.();
});

describe("memoryOperatorStore", () => {
  it("creates then loads by id and by email (case-insensitive)", async () => {
    const created = await seed();
    expect(created.operatorId).toBe("op_matthew");

    await expect(memoryOperatorStore.getById("op_matthew")).resolves.toMatchObject({
      email,
      journey: { chapter: 1, step: "start" },
    });
    await expect(memoryOperatorStore.getByEmail("matthew@astrajax.com")).resolves.toMatchObject({
      operatorId: "op_matthew",
    });
  });

  it("rejects a second create for the same email", async () => {
    await seed("op_a");
    await expect(seed("op_b")).rejects.toThrow(/already exists/i);
  });

  it("put updates journey fields and refreshes updatedAt", async () => {
    await seed();
    const before = await memoryOperatorStore.getById("op_matthew");
    expect(before).toBeDefined();

    const updated = await memoryOperatorStore.put({
      ...before!,
      journey: { chapter: 1, step: "draft-truths", completedChapters: [] },
      lastSafeDestination: "/chapter-1?book=the-ledger&resume=1",
      updatedAt: "2026-08-05T10:00:00.000Z",
    });

    expect(updated.journey?.step).toBe("draft-truths");
    expect(updated.lastSafeDestination).toBe("/chapter-1?book=the-ledger&resume=1");
    expect(updated.updatedAt).not.toBe("2026-08-05T10:00:00.000Z");
  });

  it("put fails for an unknown operator id", async () => {
    await expect(
      memoryOperatorStore.put(
        initialOperatorState({ operatorId: "missing", email: "x@y.com" }),
      ),
    ).rejects.toThrow(/Unknown operator/);
  });

  it("returns clones so callers cannot mutate the store through a prior read", async () => {
    await seed();
    const first = await memoryOperatorStore.getById("op_matthew");
    expect(first).toBeDefined();
    first!.ownedBrainSlugs.push("mutated-in-caller");

    const second = await memoryOperatorStore.getById("op_matthew");
    expect(second?.ownedBrainSlugs).toEqual([]);
  });
});
