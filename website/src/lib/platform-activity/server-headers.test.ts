import { describe, expect, it } from "vitest";
import { readOptionalSessionHandle, readTurnId } from "./server";

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://example.test/api", { headers });
}

describe("platform activity request headers", () => {
  it("readTurnId prefers a trimmed header and caps length at 160", () => {
    const long = `turn-${"a".repeat(200)}`;
    expect(readTurnId(requestWith({ "x-platform-turn-id": "  turn-abc  " }))).toBe("turn-abc");
    expect(readTurnId(requestWith({ "x-platform-turn-id": long }))).toHaveLength(160);
    expect(readTurnId(requestWith({ "x-platform-turn-id": long }))).toBe(long.slice(0, 160));
  });

  it("readTurnId synthesises a UUID when the header is missing or blank", () => {
    const generated = readTurnId(requestWith({}));
    const blank = readTurnId(requestWith({ "x-platform-turn-id": "   " }));
    expect(generated).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(blank).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(generated).not.toBe(blank);
  });

  it("readOptionalSessionHandle returns trimmed handle or null", () => {
    expect(readOptionalSessionHandle(requestWith({ "x-platform-session": "  sess_1  " }))).toBe(
      "sess_1",
    );
    expect(readOptionalSessionHandle(requestWith({}))).toBeNull();
    expect(readOptionalSessionHandle(requestWith({ "x-platform-session": "   " }))).toBeNull();
  });
});
