import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Ask Clive logging", () => {
  it("has one completion-owned log path for both streaming and non-stream responses", () => {
    const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
    expect(source.match(/await logReply\(\{/g) ?? []).toHaveLength(1);
    expect(source).not.toMatch(/const reply = \(await result\.text\)[\s\S]*await logReply\(/);
  });
});
