import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/send-code-email", () => ({
  sendSignInCode: vi.fn(async () => undefined),
}));

describe("POST /api/auth/request-code", () => {
  const originalAllowlist = process.env.OPERATOR_ALLOWLIST;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret-for-request-code";
    process.env.OPERATOR_ALLOWLIST = "matthew@astrajax.com, ops@astrajax.com";
    process.env.NODE_ENV = "production";
    vi.resetModules();
  });

  afterEach(() => {
    if (originalAllowlist === undefined) {
      delete process.env.OPERATOR_ALLOWLIST;
    } else {
      process.env.OPERATOR_ALLOWLIST = originalAllowlist;
    }
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    vi.clearAllMocks();
  });

  it("rejects a missing or malformed email", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/valid email/i);
  });

  it("returns the same success shape for an unknown email (no enumeration)", async () => {
    const { sendSignInCode } = await import("@/lib/auth/send-code-email");
    const sendMock = vi.mocked(sendSignInCode);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "stranger@example.com" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, proof: null });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("issues a proof and emails a code for an allow-listed operator", async () => {
    const { sendSignInCode } = await import("@/lib/auth/send-code-email");
    const sendMock = vi.mocked(sendSignInCode);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: " Matthew@Astrajax.com " }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(typeof body.proof).toBe("string");
    expect(body.proof).toMatch(/^\d+\.[0-9a-f]+$/i);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toBe("matthew@astrajax.com");
    expect(sendMock.mock.calls[0][1]).toMatch(/^\d{6}$/);
  });
});
