import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Ask Clive logging", () => {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

  it("has one completion-owned log path for both streaming and non-stream responses", () => {
    expect(source.match(/await logReply\(\{/g) ?? []).toHaveLength(1);
    expect(source).not.toMatch(/const reply = \(await result\.text\)[\s\S]*await logReply\(/);
  });

  it("falls back to Workshop interaction logging when platform queueing fails", () => {
    // Regression lock for the silent-drop bug: platform prefer + catch must still
    // reach handleInteractionLog rather than returning success with no write.
    expect(source).toMatch(
      /falling back to Workshop log:[\s\S]*?await handleInteractionLog\(\{/,
    );
    expect(source.match(/await handleInteractionLog\(/g) ?? []).toHaveLength(2);
    expect(source).toContain("Ask Clive platform activity queue failed");
    expect(source).toContain("Ask Clive fallback platform queue failed");
  });
});
