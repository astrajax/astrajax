import { describe, expect, it } from "vitest";
import {
  DEFAULT_STORY_MODE,
  isPortraitNavigationEnabled,
  parseStoryMode,
} from "./story-mode";

describe("story-mode", () => {
  it("defaults to no-story on the marketing site", () => {
    expect(parseStoryMode(null)).toBe(DEFAULT_STORY_MODE);
    expect(parseStoryMode(undefined)).toBe("no-story");
    expect(parseStoryMode("invalid")).toBe("no-story");
  });

  it("parses valid modes", () => {
    expect(parseStoryMode("light")).toBe("light");
    expect(parseStoryMode("no-story")).toBe("no-story");
    expect(parseStoryMode("full")).toBe("full");
  });

  it("keeps portrait doors unmounted from the public site", () => {
    expect(isPortraitNavigationEnabled("full")).toBe(false);
    expect(isPortraitNavigationEnabled("light")).toBe(false);
    expect(isPortraitNavigationEnabled("no-story")).toBe(false);
  });
});
