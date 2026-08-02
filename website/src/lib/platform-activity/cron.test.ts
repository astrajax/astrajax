import { afterEach, describe, expect, it } from "vitest";
import { assertCronAuthorised } from "./cron";

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("assertCronAuthorised", () => {
  it("rejects when CRON_SECRET is not configured", () => {
    expect(() =>
      assertCronAuthorised(new Request("https://example.com/api/cron", {
        headers: { authorization: "Bearer anything" },
      })),
    ).toThrow(/CRON_SECRET is not configured/);
  });

  it("accepts a matching Bearer token", () => {
    process.env.CRON_SECRET = "cron-test-secret";
    expect(() =>
      assertCronAuthorised(
        new Request("https://example.com/api/cron", {
          headers: { authorization: "Bearer cron-test-secret" },
        }),
      ),
    ).not.toThrow();
  });

  it("accepts a matching x-cron-secret header", () => {
    process.env.CRON_SECRET = "cron-test-secret";
    expect(() =>
      assertCronAuthorised(
        new Request("https://example.com/api/cron", {
          headers: { "x-cron-secret": "cron-test-secret" },
        }),
      ),
    ).not.toThrow();
  });

  it("rejects mismatched credentials", () => {
    process.env.CRON_SECRET = "cron-test-secret";
    expect(() =>
      assertCronAuthorised(
        new Request("https://example.com/api/cron", {
          headers: {
            authorization: "Bearer wrong",
            "x-cron-secret": "also-wrong",
          },
        }),
      ),
    ).toThrow(/Unauthorised scheduled worker request/);
  });
});
