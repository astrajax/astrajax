import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetOnboardingUploadRateLimitForTests } from "@/lib/onboarding/upload-rate-limit";

vi.mock("@/lib/brains/handlers/onboarding-source-document", () => ({
  handleOnboardingSourceDocument: vi.fn(),
}));

function post(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/onboarding/source-document", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding/source-document", () => {
  beforeEach(() => {
    resetOnboardingUploadRateLimitForTests();
    vi.resetModules();
  });

  afterEach(() => {
    resetOnboardingUploadRateLimitForTests();
    vi.clearAllMocks();
  });

  it("files a staged onboarding upload and returns the record id", async () => {
    const { handleOnboardingSourceDocument } = await import(
      "@/lib/brains/handlers/onboarding-source-document"
    );
    vi.mocked(handleOnboardingSourceDocument).mockResolvedValue({
      mode: "airtable",
      saved: true,
      recordId: "recFiled1234567",
      blobRetained: false,
    });

    const { POST } = await import("./route");
    const response = await POST(
      post({
        blobUrl:
          "https://example.private.blob.vercel-storage.com/onboarding-uploads/abc-notes.pdf",
        filename: "notes.pdf",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      saved: true,
      recordId: "recFiled1234567",
    });
    expect(handleOnboardingSourceDocument).toHaveBeenCalledWith(
      "onboarding-uploads/abc-notes.pdf",
      expect.objectContaining({ filename: "notes.pdf" }),
    );
  });

  it("refuses a blob outside the onboarding staging prefix", async () => {
    const { handleOnboardingSourceDocument } = await import(
      "@/lib/brains/handlers/onboarding-source-document"
    );
    const { POST } = await import("./route");

    const response = await POST(
      post({ blobUrl: "https://example.public.blob.vercel-storage.com/media/secret.pdf" }),
    );

    expect(response.status).toBe(400);
    expect(handleOnboardingSourceDocument).not.toHaveBeenCalled();
  });

  it("refuses a staged key whose extension is outside the Source Pack allowlist", async () => {
    const { handleOnboardingSourceDocument } = await import(
      "@/lib/brains/handlers/onboarding-source-document"
    );
    const { POST } = await import("./route");

    const response = await POST(post({ pathname: "onboarding-uploads/payload.exe" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/not allowed/),
    });
    expect(handleOnboardingSourceDocument).not.toHaveBeenCalled();
  });

  it("passes the honest fallback through when Workshop is unwired", async () => {
    const { handleOnboardingSourceDocument } = await import(
      "@/lib/brains/handlers/onboarding-source-document"
    );
    vi.mocked(handleOnboardingSourceDocument).mockResolvedValue({
      mode: "fallback",
      saved: false,
      blobRetained: true,
      message: "Workshop Source Documents not wired (BRAIN_WORKSHOP_WRITE_TOKEN).",
    });

    const { POST } = await import("./route");
    const response = await POST(
      post({ pathname: "onboarding-uploads/abc-notes.pdf", filename: "notes.pdf" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      saved: false,
      blobRetained: true,
    });
  });

  it("reports a filing crash as unsaved with staging retained", async () => {
    const { handleOnboardingSourceDocument } = await import(
      "@/lib/brains/handlers/onboarding-source-document"
    );
    vi.mocked(handleOnboardingSourceDocument).mockRejectedValue(
      new Error("Airtable API error 500: boom"),
    );

    const { POST } = await import("./route");
    const response = await POST(post({ pathname: "onboarding-uploads/abc-notes.pdf" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      saved: false,
      blobRetained: true,
    });
  });

  it("rate-limits repeated filing attempts from one client", async () => {
    const { handleOnboardingSourceDocument } = await import(
      "@/lib/brains/handlers/onboarding-source-document"
    );
    vi.mocked(handleOnboardingSourceDocument).mockResolvedValue({
      mode: "airtable",
      saved: true,
      recordId: "recFiled1234567",
      blobRetained: false,
    });

    const { POST } = await import("./route");
    let lastStatus = 200;
    for (let i = 0; i < 20; i += 1) {
      const response = await POST(post({ pathname: "onboarding-uploads/abc-notes.pdf" }));
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});
