import { afterEach, describe, expect, it } from "vitest";
import { isAllowedOperatorEmail } from "./allow-list";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("isAllowedOperatorEmail", () => {
  it("denies everyone in production when the allow-list is unset or blank", () => {
    process.env.NODE_ENV = "production";
    delete process.env.OPERATOR_ALLOWLIST;
    expect(isAllowedOperatorEmail("matthew@astrajax.com")).toBe(false);

    process.env.OPERATOR_ALLOWLIST = "   ";
    expect(isAllowedOperatorEmail("matthew@astrajax.com")).toBe(false);
  });

  it("allows any email in development when the allow-list is unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.OPERATOR_ALLOWLIST;
    expect(isAllowedOperatorEmail("anyone@example.com")).toBe(true);
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    process.env.NODE_ENV = "production";
    process.env.OPERATOR_ALLOWLIST = " Matthew@AstraJax.com , other@example.com ";
    expect(isAllowedOperatorEmail("matthew@astrajax.com")).toBe(true);
    expect(isAllowedOperatorEmail(" OTHER@example.com ")).toBe(true);
    expect(isAllowedOperatorEmail("stranger@example.com")).toBe(false);
  });

  it("drops empty comma slots so a trailing comma cannot open the gate", () => {
    process.env.NODE_ENV = "production";
    process.env.OPERATOR_ALLOWLIST = "matthew@astrajax.com,";
    expect(isAllowedOperatorEmail("")).toBe(false);
    expect(isAllowedOperatorEmail("matthew@astrajax.com")).toBe(true);
  });
});
