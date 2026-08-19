import { afterEach, describe, expect, it } from "vitest";
import { getWorkshopReadToken } from "./config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getWorkshopReadToken", () => {
  it("prefers the dedicated Workshop read PAT when set", () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    process.env.BRAIN_WORKSHOP_WRITE_TOKEN = "patWrite";
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "patPromote";

    expect(getWorkshopReadToken()).toBe("patRead");
  });

  it("falls back to write then promote when the read PAT is unset", () => {
    delete process.env.BRAIN_WORKSHOP_READ_TOKEN;
    process.env.BRAIN_WORKSHOP_WRITE_TOKEN = "patWrite";
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    expect(getWorkshopReadToken()).toBe("patWrite");

    delete process.env.BRAIN_WORKSHOP_WRITE_TOKEN;
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "patPromote";
    expect(getWorkshopReadToken()).toBe("patPromote");

    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    expect(getWorkshopReadToken()).toBeUndefined();
  });

  it("treats empty or whitespace read PAT as unset so write fallback still works", () => {
    process.env.BRAIN_WORKSHOP_WRITE_TOKEN = "patWrite";
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;

    process.env.BRAIN_WORKSHOP_READ_TOKEN = "";
    expect(getWorkshopReadToken()).toBe("patWrite");

    process.env.BRAIN_WORKSHOP_READ_TOKEN = "   ";
    expect(getWorkshopReadToken()).toBe("patWrite");
  });
});
