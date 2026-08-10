import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression lock for the Phase 2 /command gate bug: a layout wrapping every
 * /command/* child 404'd the customer Command Centre rooms (/command/clive,
 * /command/doc, /command/pam). The internal gate must stay on the index page
 * only — not a route-group layout.
 */
describe("Command Centre gate scope", () => {
  const commandDir = join(process.cwd(), "src/app/command");
  const indexSource = readFileSync(join(commandDir, "page.tsx"), "utf8");

  it("gates the bare /command index with requireInternalOperator", () => {
    expect(indexSource).toMatch(/requireInternalOperator/);
    expect(indexSource).toMatch(/await requireInternalOperator\(\)/);
  });

  it("does not introduce a /command layout that would wrap customer rooms", () => {
    expect(existsSync(join(commandDir, "layout.tsx"))).toBe(false);
  });

  it("keeps customer room pages free of the internal gate", () => {
    for (const room of ["clive", "doc", "pam"] as const) {
      const pagePath = join(commandDir, room, "page.tsx");
      expect(existsSync(pagePath)).toBe(true);
      const source = readFileSync(pagePath, "utf8");
      expect(source).not.toMatch(/requireInternalOperator/);
      expect(source).not.toMatch(/require-internal/);
    }
  });

  it("still lists only the customer room directories as public children", () => {
    const children = readdirSync(commandDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(children).toEqual(["clive", "doc", "pam"]);
  });
});
