/**
 * @vitest-environment node
 *
 * printed-ink — structural regression check for the centralised printed-ink
 * text layer. Reads globals.css and asserts the canonical material contract:
 * the shared fibre + presets exist exactly once, the two live surfaces consume
 * them (rather than re-deriving), the .no-ink exception route exists, and the
 * accessibility fallbacks are present. Catches the two failure modes this
 * centralisation exists to prevent: (1) someone deleting/renaming a shared
 * token and silently breaking every ink surface, and (2) a future surface
 * hand-rolling its own fibre/shadow instead of opting into the layer.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8",
);

describe("printed-ink shared layer", () => {
  it("defines the shared fibre tile exactly once, on :root", () => {
    expect(css).toContain("--ink-fibre: url(\"data:image/svg+xml");
    expect(css.match(/--ink-fibre:/g) ?? []).toHaveLength(1);
  });

  it("defines the three canonical presets and their warm variants", () => {
    for (const token of [
      "--ink-body-shadow:",
      "--ink-display-shadow:",
      "--ink-label-shadow:",
      "--ink-body-shadow-warm:",
      "--ink-display-shadow-warm:",
      "--ink-label-shadow-warm:",
    ]) {
      expect(css, `missing ${token}`).toContain(token);
    }
  });

  it("carries the default page geometry for the fibre veil", () => {
    for (const token of [
      "--ink-page-l-left:",
      "--ink-page-r-left:",
      "--ink-fibre-opacity:",
    ]) {
      expect(css, `missing ${token}`).toContain(token);
    }
  });

  it("exposes the .no-ink exception route", () => {
    expect(css).toMatch(/\.no-ink,\s*\n\.no-ink \*\s*{/);
  });
});

describe("ink surfaces consume the shared layer", () => {
  it("the Living Folio scope uses the shared presets, not local re-definitions", () => {
    expect(css).toContain("FOLIO SCOPE");
    expect(css).toContain(".study-stage--book");
    // consumes shared tokens
    expect(css).toContain("text-shadow: var(--ink-body-shadow);");
    expect(css).toContain("text-shadow: var(--ink-display-shadow);");
    expect(css).toContain("text-shadow: var(--ink-label-shadow);");
    // no stale folio-local ink vars survive
    expect(css).not.toContain("--folio-ink-");
  });

  it("the Court scope warm-tunes the shared grammar, not a copy of it", () => {
    expect(css).toContain("COURT SCOPE");
    expect(css).toContain(".court-stage {");
    expect(css).toContain("text-shadow: var(--ink-body-shadow-warm);");
    expect(css).not.toContain("--court-ink-");
  });

  it("both surfaces activate the shared fibre veil", () => {
    // the shared ::before/::after selector group includes both surfaces
    expect(css).toMatch(
      /\.study-stage--book::before,\s*\n\.study-stage--book::after,\s*\n\.platform-court__book-container::before,\s*\n\.platform-court__book-container::after\s*{/,
    );
  });

  it("keeps the accessibility fallbacks", () => {
    // forced-colours strips texture on both surfaces
    const forced = css.match(/@media \(forced-colors: active\)/g) ?? [];
    expect(forced.length).toBeGreaterThanOrEqual(2);
    // small-label mobile strip
    expect(css).toMatch(/@media \(max-width: 767px\)/);
    // reduced-motion veil guard
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
