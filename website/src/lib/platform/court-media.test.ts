import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COURT_JUDGE_MEDIA, COURT_PORTRAIT_SRC, COURT_ROLES } from "./court";

/**
 * Court rendered empty frames for a week because the code asked for files
 * that were never on disk — nothing checked. This is that check: every
 * media path the Court references must resolve to a real file under
 * public/. It fails loudly, by name, the moment a path drifts again.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public");

function resolvePublic(src: string): string {
  return path.join(PUBLIC_DIR, src.replace(/^\//, ""));
}

describe("court media paths resolve on disk", () => {
  it("public/ is where we think it is", () => {
    expect(existsSync(PUBLIC_DIR)).toBe(true);
  });

  it.each(Object.entries(COURT_PORTRAIT_SRC))(
    "portrait for %s exists",
    (_id, src) => {
      expect(src.startsWith("/")).toBe(true);
      expect(existsSync(resolvePublic(src)), `missing file for ${src}`).toBe(true);
    },
  );

  it.each(Object.entries(COURT_JUDGE_MEDIA))(
    "judge %s exists",
    (_kind, src) => {
      expect(src.startsWith("/")).toBe(true);
      expect(existsSync(resolvePublic(src)), `missing file for ${src}`).toBe(true);
    },
  );

  it("every seated role's portrait is a checked path", () => {
    const checked = new Set<string>(Object.values(COURT_PORTRAIT_SRC));
    for (const role of COURT_ROLES) {
      if (role.id === "judge") {
        expect(role.portraitSrc).toBeUndefined();
        continue;
      }
      expect(role.portraitSrc, `no portrait on role ${role.id}`).toBeDefined();
      expect(checked.has(role.portraitSrc as string)).toBe(true);
    }
  });
});
