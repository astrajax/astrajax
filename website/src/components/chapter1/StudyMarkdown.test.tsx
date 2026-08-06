/**
 * @vitest-environment jsdom
 *
 * StudyMarkdown — the assistant-Markdown renderer for the Living Folio.
 * Renders supported structure as semantic live HTML; sanitisation is
 * structural (React elements, never a HTML string / dangerouslySetInnerHTML).
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StudyMarkdown } from "./StudyMarkdown";

function html(content: string): string {
  return renderToStaticMarkup(createElement(StudyMarkdown, { content }));
}

describe("StudyMarkdown", () => {
  it("renders paragraphs, splitting on blank lines", () => {
    const out = html("First line.\n\nSecond line.");
    expect(out).toContain("First line.");
    expect(out).toContain("Second line.");
    expect((out.match(/<p/g) ?? []).length).toBe(2);
  });

  it("renders **strong** and *em* inline, not raw asterisks", () => {
    const out = html("This has **bold** and *emphasis*.");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>emphasis</em>");
    expect(out).not.toContain("**");
  });

  it("renders --- as a thematic break, not literal dashes", () => {
    const out = html("Above.\n\n---\n\nBelow.");
    expect(out).toContain("<hr");
    expect(out).not.toContain("---");
  });

  it("renders - bullets as an unordered list", () => {
    const out = html("Steps:\n- Map your situation\n- Draft structure\n- Flag pushback");
    expect(out).toContain("<ul");
    expect(out).toContain("Map your situation");
    expect((out.match(/<li/g) ?? []).length).toBe(3);
  });

  it("renders 1. items as an ordered list", () => {
    const out = html("Plan:\n1. First\n2. Second");
    expect(out).toContain("<ol");
    expect((out.match(/<li/g) ?? []).length).toBe(2);
  });

  it("renders links with safe hrefs and external rel", () => {
    const out = html("See [the guide](https://example.com/x) for more.");
    expect(out).toContain('href="https://example.com/x"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain(">the guide</a>");
  });

  it("keeps same-site relative links without target=_blank", () => {
    const out = html("Go to [brain review](/brain/review).");
    expect(out).toContain('href="/brain/review"');
    expect(out).not.toContain('target="_blank"');
  });

  it("drops unsafe hrefs and renders the text plainly", () => {
    const out = html("Bad [click](javascript:alert(1)) here.");
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<a");
    expect(out).toContain("click");
  });

  it("NEVER injects arbitrary HTML — raw tags are escaped", () => {
    const out = html("Inject <img src=x onerror=alert(1)> and <script>alert(2)</script>.");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;img");
  });

  it("keeps text selectable/copyable (no images of text, no pseudo-content)", () => {
    const out = html("Plain **selectable** copy.");
    expect(out).toContain("selectable");
    // semantic, not an asset
    expect(out).not.toContain("data:image");
  });
});
