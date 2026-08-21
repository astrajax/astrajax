import { describe, expect, it } from "vitest";
import {
  BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS,
  BRAIN_WORKSHOP_NEWS_WATCH_THEMES_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  BRAIN_WORKSHOP_USER_BRAINS_DEMO,
  BRAIN_WORKSHOP_USER_BRAINS_FIELDS,
} from "./airtable-ids";

/**
 * Locks IDs landed in recent merges so a mirror/table swap cannot silently
 * re-point capture or scout writers (#186 User Brains, #184 news themes,
 * #193 Trusted incubation meter).
 */
describe("workshop + trusted IDs from recent merges", () => {
  it("keeps User Brains on the live Registry sync mirror (#186)", () => {
    expect(BRAIN_WORKSHOP_TABLES.userBrains).toBe("tbl8ovE5njOh1c6iK");
    expect(BRAIN_WORKSHOP_USER_BRAINS_DEMO.matthew).toBe("recpLovK4TIiORYcW");
    expect(BRAIN_WORKSHOP_USER_BRAINS_FIELDS.userLabel).toBe("fldra752LD1ZsOuw9");
    expect(BRAIN_WORKSHOP_USER_BRAINS_FIELDS.guideMode).toBe("fldM3t8cHqqfttM8G");
    expect(BRAIN_WORKSHOP_USER_BRAINS_FIELDS.aiConfidence).toBe("fldSdUQ8wFflVKsUc");
    expect(BRAIN_WORKSHOP_USER_BRAINS_FIELDS.draftBrainTruth).toBe("fldD1vejxoQyE3xal");
  });

  it("locks News Watch Themes field IDs for ristral-news-scout (#184)", () => {
    expect(BRAIN_WORKSHOP_TABLES.newsWatchThemes).toBe("tblAdsvI5tDNERXQK");
    expect(BRAIN_WORKSHOP_NEWS_WATCH_THEMES_FIELDS).toEqual({
      themeKey: "fldNagHPssfv1Lqof",
      themeLabel: "fldHqXNuU9CYVoqMC",
      watch: "flduuqfPOSsJNpfu3",
      searchLens: "fldhoOI72CPk5odAf",
      notes: "fldoulvrxVjUkPqdB",
    });
  });

  it("locks Trusted incubation dual-register + Text Characters (#193)", () => {
    expect(BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.canonicalTextForHumans).toBe(
      "fld8EiI0tAZh8tIs0",
    );
    expect(BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS.textCharacters).toBe(
      "fldUnZSHrKHFcZQDz",
    );
  });
});
