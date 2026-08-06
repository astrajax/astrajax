/**
 * @vitest-environment jsdom
 *
 * DOM-validity contract for the assistant-Markdown renderers — the two
 * blockers from the independent diff review (5 Aug):
 *
 * - No nested <p><p> (assistant markdown must not render inside a <p>).
 * - No block element (p/ul/ol/hr) inside an inline <span> or <p>.
 * - Rendered output stays semantic, selectable and sanitised.
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StudyMarkdown } from "./StudyMarkdown";

function html(content: string): string {
  return renderToStaticMarkup(
    createElement(StudyMarkdown, { content, paragraphClassName: "clive-chat__md-para" }),
  );
}

const STRUCTURED = "Intro **bold** line.\n\n---\n\nSteps:\n- One\n- Two\n\n1. First\n2. Second\n\nSee [x](/y).";

describe("StudyMarkdown — DOM validity", () => {
  it("never nests a <p> inside a <p>", () => {
    const out = html(STRUCTURED);
    // No <p> whose immediate or nested content begins another <p>.
    expect(out).not.toMatch(/<p[^>]*>\s*<p/);
    // Count top-level <p> tags equals the number of paragraph blocks.
    const pCount = (out.match(/<p[\s>]/g) ?? []).length;
    expect(pCount).toBe(3); // intro, "Steps:", "See x"
  });

  it("emits block structure (ul/ol/hr) as siblings, not wrapped in <p> or <span>", () => {
    const out = html(STRUCTURED);
    expect(out).toContain("<hr");
    expect(out).toContain("<ul");
    expect(out).toContain("<ol");
    // A <p> must not directly contain a list or hr.
    expect(out).not.toMatch(/<p[^>]*>[^<]*<(ul|ol|hr)/);
    // No <span> wrapping block elements.
    expect(out).not.toMatch(/<span[^>]*>\s*<(p|ul|ol|hr)/);
  });

  it("emits no <span> at all for block-level structure", () => {
    const out = html(STRUCTURED);
    // The component renders only p/ul/ol/hr/strong/em/a — never span wrappers.
    expect(out).not.toContain("<span");
  });

  it("keeps output semantic + selectable (text present, no text-as-image)", () => {
    const out = html(STRUCTURED);
    for (const needle of ["Intro", "One", "Two", "First", "Second"]) {
      expect(out).toContain(needle);
    }
    expect(out).not.toContain("data:image");
    expect(out).toContain("<strong>bold</strong>");
  });

  it("stays sanitised — arbitrary HTML is escaped, safe links only", () => {
    const out = html("Inject <img src=x onerror=alert(1)> [bad](javascript:alert(1)) [ok](/safe).");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("javascript:");
    expect(out).toContain('href="/safe"');
  });
});
