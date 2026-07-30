export type StoryMode = "full" | "light" | "no-story";

export const STORY_MODE_STORAGE_KEY = "astrajax-story-mode";

export const STORY_MODE_LABELS: Record<StoryMode, string> = {
  full: "Full story",
  light: "Light story",
  "no-story": "No story",
};

export const DEFAULT_STORY_MODE: StoryMode = "no-story";

/**
 * Portrait doors into the platform are unmounted from the public marketing site.
 * Platform rooms remain in the repo for iteration on localhost / *.vercel.app.
 */
export function isPortraitNavigationEnabled(_mode: StoryMode): boolean {
  return false;
}

export function parseStoryMode(value: string | null | undefined): StoryMode {
  if (value === "light" || value === "no-story" || value === "full") {
    return value;
  }
  return DEFAULT_STORY_MODE;
}
