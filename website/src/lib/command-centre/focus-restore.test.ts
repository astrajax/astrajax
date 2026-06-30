/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { focusPortraitDoor } from "./focus-restore";

describe("focusPortraitDoor", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "performance"] });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(performance.now()), 0) as unknown as number;
    });
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("focuses immediately when the portrait door is mounted", () => {
    const link = document.createElement("a");
    link.href = "/command/clive";
    link.setAttribute("data-portrait-door", "clive");
    document.body.appendChild(link);

    focusPortraitDoor("clive");

    expect(document.activeElement).toBe(link);
  });

  it("retries until the portrait door appears", async () => {
    focusPortraitDoor("clive");
    expect(document.querySelector('[data-portrait-door="clive"]')).toBeNull();

    const link = document.createElement("a");
    link.href = "/command/clive";
    link.setAttribute("data-portrait-door", "clive");
    document.body.appendChild(link);

    await vi.runAllTimersAsync();

    expect(document.activeElement).toBe(link);
  });
});
