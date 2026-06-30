import { describe, expect, it } from "vitest";
import {
  DEFAULT_STORY_MODE,
  isPortraitNavigationEnabled,
  parseStoryMode,
} from "./story-mode";

describe("story-mode", () => {
  it("defaults to full story", () => {
    expect(parseStoryMode(null)).toBe(DEFAULT_STORY_MODE);
    expect(parseStoryMode(undefined)).toBe("full");
    expect(parseStoryMode("invalid")).toBe("full");
  });

  it("parses valid modes", () => {
    expect(parseStoryMode("light")).toBe("light");
    expect(parseStoryMode("no-story")).toBe("no-story");
    expect(parseStoryMode("full")).toBe("full");
  });

  it("enables portrait doors only in full story", () => {
    expect(isPortraitNavigationEnabled("full")).toBe(true);
    expect(isPortraitNavigationEnabled("light")).toBe(false);
    expect(isPortraitNavigationEnabled("no-story")).toBe(false);
  });
});
