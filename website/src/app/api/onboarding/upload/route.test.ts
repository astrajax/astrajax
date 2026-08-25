import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetOnboardingUploadRateLimitForTests } from "@/lib/onboarding/upload-rate-limit";

vi.mock("@vercel/blob/client", () => ({
  handleUpload: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  del: vi.fn(async () => undefined),
}));

describe("POST /api/onboarding/upload", () => {
  beforeEach(() => {
    resetOnboardingUploadRateLimitForTests();
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    vi.resetModules();
  });

  afterEach(() => {
    resetOnboardingUploadRateLimitForTests();
    vi.clearAllMocks();
  });

  it("rejects multipart form posts that used to proxy file bytes", async () => {
    const { POST } = await import("./route");
    const form = new FormData();
    form.append("file", new File(["hello"], "x.txt", { type: "text/plain" }));
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "POST",
      body: form,
    });
    const response = await POST(request);
    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.error).toMatch(/token mint/i);
  });

  it("mints a token with Source Pack constraints via handleUpload", async () => {
    const { handleUpload } = await import("@vercel/blob/client");
    const handleUploadMock = vi.mocked(handleUpload);
    handleUploadMock.mockImplementation(async (opts) => {
      const tokenResult = await opts.onBeforeGenerateToken(
        "onboarding-uploads/abc-note.txt",
        JSON.stringify({ sizeBytes: 2048 }),
        false,
      );
      expect(tokenResult.maximumSizeInBytes).toBe(2048);
      expect(tokenResult.addRandomSuffix).toBe(true);
      expect(tokenResult.allowedContentTypes).toContain("text/plain");
      return { type: "blob.generate-client-token", clientToken: "tok_test" };
    });

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.50",
      },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "onboarding-uploads/abc-note.txt",
          multipart: false,
          clientPayload: JSON.stringify({ sizeBytes: 2048 }),
        },
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.clientToken).toBe("tok_test");
  });

  it("refuses tokens outside the onboarding-uploads prefix", async () => {
    const { handleUpload } = await import("@vercel/blob/client");
    const handleUploadMock = vi.mocked(handleUpload);
    handleUploadMock.mockImplementation(async (opts) => {
      await opts.onBeforeGenerateToken(
        "other-prefix/note.txt",
        JSON.stringify({ sizeBytes: 100 }),
        false,
      );
      return { type: "blob.generate-client-token", clientToken: "tok_test" };
    });

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "other-prefix/note.txt",
          multipart: false,
          clientPayload: JSON.stringify({ sizeBytes: 100 }),
        },
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/onboarding-uploads/);
  });

  it("refuses tokens for disallowed filename extensions", async () => {
    const { handleUpload } = await import("@vercel/blob/client");
    const handleUploadMock = vi.mocked(handleUpload);
    handleUploadMock.mockImplementation(async (opts) => {
      await opts.onBeforeGenerateToken(
        "onboarding-uploads/abc-payload.exe",
        JSON.stringify({ sizeBytes: 100 }),
        false,
      );
      return { type: "blob.generate-client-token", clientToken: "tok_test" };
    });

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "onboarding-uploads/abc-payload.exe",
          multipart: false,
          clientPayload: JSON.stringify({ sizeBytes: 100 }),
        },
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/not allowed/i);
    expect(body.error).toMatch(/\.exe/);
  });

  it("returns 503 when Blob storage is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;

    const { handleUpload } = await import("@vercel/blob/client");
    const handleUploadMock = vi.mocked(handleUpload);

    const { POST } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "onboarding-uploads/abc-note.txt",
          multipart: false,
          clientPayload: JSON.stringify({ sizeBytes: 100 }),
        },
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toMatch(/Blob storage is not configured/i);
    expect(handleUploadMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/onboarding/upload", () => {
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when Blob storage is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;

    const { del } = await import("@vercel/blob");
    const delMock = vi.mocked(del);

    const { DELETE } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pathname: "onboarding-uploads/abc-note.txt" }),
    });
    const response = await DELETE(request);
    expect(response.status).toBe(503);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("requires url or pathname", async () => {
    const { DELETE } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await DELETE(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/url or pathname required/i);
  });

  it("refuses deletes outside the onboarding-uploads prefix", async () => {
    const { del } = await import("@vercel/blob");
    const delMock = vi.mocked(del);

    const { DELETE } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pathname: "media-assets/logo.png" }),
    });
    const response = await DELETE(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/onboarding-uploads/);
    expect(delMock).not.toHaveBeenCalled();
  });

  it("deletes a staging blob under the onboarding prefix", async () => {
    const { del } = await import("@vercel/blob");
    const delMock = vi.mocked(del);
    delMock.mockResolvedValue(undefined);

    const { DELETE } = await import("./route");
    const request = new NextRequest("http://localhost/api/onboarding/upload", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pathname: "onboarding-uploads/abc-note.txt" }),
    });
    const response = await DELETE(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(delMock).toHaveBeenCalledWith("onboarding-uploads/abc-note.txt", {
      token: "vercel_blob_rw_test",
    });
  });
});
