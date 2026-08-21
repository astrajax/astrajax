import { describe, expect, it } from "vitest";
import {
  assertOnboardingUploadExtension,
  assertOnboardingUploadPathname,
  toOnboardingUploadPathname,
} from "./upload-path";

describe("onboarding upload path guard", () => {
  it("accepts a staging key directly under the onboarding prefix", () => {
    expect(() =>
      assertOnboardingUploadPathname("onboarding-uploads/abc-notes.pdf"),
    ).not.toThrow();
  });

  it.each([
    ["another prefix", "media-assets/logo.png"],
    ["a traversal attempt", "onboarding-uploads/../secrets.pdf"],
    ["a nested key", "onboarding-uploads/nested/notes.pdf"],
    ["a bare prefix", "onboarding-uploads/"],
  ])("rejects %s", (_label, pathname) => {
    expect(() => assertOnboardingUploadPathname(pathname)).toThrow();
  });

  it("reduces a blob URL to its staging key without trusting the host", () => {
    expect(
      toOnboardingUploadPathname(
        "https://example.private.blob.vercel-storage.com/onboarding-uploads/abc-notes.pdf",
      ),
    ).toBe("onboarding-uploads/abc-notes.pdf");
  });

  it("rejects a URL pointing outside the onboarding prefix", () => {
    expect(() =>
      toOnboardingUploadPathname("https://evil.example.com/etc/passwd"),
    ).toThrow(/onboarding-uploads\//);
  });

  it("rejects an empty target", () => {
    expect(() => toOnboardingUploadPathname("   ")).toThrow(/required/);
  });

  it("enforces the Source Pack extension allowlist", () => {
    expect(() =>
      assertOnboardingUploadExtension("onboarding-uploads/notes.pdf"),
    ).not.toThrow();
    expect(() =>
      assertOnboardingUploadExtension("onboarding-uploads/script.exe"),
    ).toThrow(/not allowed/);
  });
});
