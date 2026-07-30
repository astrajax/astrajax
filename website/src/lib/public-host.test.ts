import { describe, expect, it } from "vitest";
import {
  isPlatformPagePath,
  isPublicApiPath,
  isPublicMarketingRequest,
  resolveRequestHost,
} from "./public-host";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("public-host", () => {
  it("treats astrajax.com and www as the marketing host", () => {
    expect(isPublicMarketingRequest(headers({ host: "astrajax.com" }))).toBe(true);
    expect(isPublicMarketingRequest(headers({ host: "www.astrajax.com" }))).toBe(true);
    expect(isPublicMarketingRequest(headers({ host: "ASTRAJAX.COM:443" }))).toBe(true);
  });

  it("lets localhost and previews through", () => {
    expect(isPublicMarketingRequest(headers({ host: "localhost:3000" }))).toBe(false);
    expect(
      isPublicMarketingRequest(headers({ host: "astrajax-git-main.vercel.app" })),
    ).toBe(false);
  });

  it("prefers the forwarded host so a proxy cannot bypass the gate", () => {
    expect(
      resolveRequestHost(headers({ "x-forwarded-host": "astrajax.com", host: "internal:3000" })),
    ).toBe("astrajax.com");
    expect(
      isPublicMarketingRequest(
        headers({ "x-forwarded-host": "astrajax.com, proxy.internal", host: "internal:3000" }),
      ),
    ).toBe(true);
  });

  it("identifies platform pages without catching lookalike marketing paths", () => {
    expect(isPlatformPagePath("/brain")).toBe(true);
    expect(isPlatformPagePath("/brain/astrajax-chapter-1")).toBe(true);
    expect(isPlatformPagePath("/command/clive")).toBe(true);
    expect(isPlatformPagePath("/")).toBe(false);
    expect(isPlatformPagePath("/seeds-of-promise")).toBe(false);
    expect(isPlatformPagePath("/brainstorming")).toBe(false);
  });

  it("allowlists only the marketing APIs", () => {
    expect(isPublicApiPath("/api/ask-clive")).toBe(true);
    expect(isPublicApiPath("/api/clive-voice")).toBe(true);
    expect(isPublicApiPath("/api/platform-sessions/start")).toBe(true);
    expect(isPublicApiPath("/api/platform-activity/worker")).toBe(true);
    expect(isPublicApiPath("/api/brains/curation/confirm")).toBe(false);
    expect(isPublicApiPath("/api/brains/list")).toBe(false);
    expect(isPublicApiPath("/api/chapter1/draft-truths")).toBe(false);
    expect(isPublicApiPath("/api/court/deliberate")).toBe(false);
  });
});
