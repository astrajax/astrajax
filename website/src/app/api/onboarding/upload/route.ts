/**
 * Onboarding client-direct Blob upload — token minting only.
 *
 * The browser uploads file bytes straight to Vercel Blob via
 * `@vercel/blob/client` `upload()`. This route never receives file bytes;
 * it only mints a short-lived, scoped client token (and deletes orphans).
 *
 * Token constraints (enforced by Blob, not the browser):
 * - pathname under onboarding-uploads/
 * - allowed filename extensions (SOURCE_PACK_LIMITS.allowedExtensions)
 * - allowed content types
 * - per-file max size (20 MiB)
 * - random suffix (collision-safe keys)
 *
 * Session budgets (5 files / 50 MiB) are enforced here via the per-IP
 * rate limiter before a token is minted — same pattern as Brain Key.
 */
import { del } from "@vercel/blob";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { SOURCE_PACK_LIMITS } from "@/lib/onboarding/machine";
import {
  assertOnboardingUploadExtension,
  assertOnboardingUploadPathname,
  toOnboardingUploadPathname,
} from "@/lib/onboarding/upload-path";
import {
  checkOnboardingUploadRateLimit,
  refundOnboardingUploadRateLimit,
} from "@/lib/onboarding/upload-rate-limit";

type ClientPayload = {
  sizeBytes?: number;
};

function clientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

function parseClientPayload(raw: string | null): ClientPayload {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const sizeBytes = (parsed as ClientPayload).sizeBytes;
    return {
      sizeBytes:
        typeof sizeBytes === "number" && Number.isFinite(sizeBytes)
          ? sizeBytes
          : undefined,
    };
  } catch {
    return {};
  }
}

function blobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_STORE_ID ||
    process.env.VERCEL_OIDC_TOKEN,
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        error:
          "Direct file upload to this route is disabled. Use the client upload flow (token mint).",
      },
      { status: 410 },
    );
  }

  let charged: { ip?: string; sizeBytes: number } | null = null;

  try {
    if (!blobConfigured()) {
      return NextResponse.json(
        {
          error:
            "Blob storage is not configured (missing BLOB_READ_WRITE_TOKEN).",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as HandleUploadBody;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const ip = clientIp(request);

    const jsonResponse = await handleUpload({
      body,
      request,
      ...(token ? { token } : {}),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        assertOnboardingUploadPathname(pathname);
        assertOnboardingUploadExtension(pathname);

        const payload = parseClientPayload(clientPayload);
        const sizeBytes = payload.sizeBytes;
        if (sizeBytes === undefined || sizeBytes <= 0) {
          throw new Error("Missing or invalid sizeBytes in client payload");
        }
        if (sizeBytes > SOURCE_PACK_LIMITS.maxBytesPerFile) {
          throw new Error(
            `File too large: ${Math.round(sizeBytes / 1024 / 1024)} MiB exceeds ${SOURCE_PACK_LIMITS.maxBytesPerFile / 1024 / 1024} MiB limit`,
          );
        }

        const limit = checkOnboardingUploadRateLimit({ ip, sizeBytes });
        if (!limit.allowed) {
          const err = new Error(
            limit.reason || "Too many uploads. Try again later.",
          );
          (
            err as Error & { status?: number; retryAfterSeconds?: number }
          ).status = 429;
          (err as Error & { retryAfterSeconds?: number }).retryAfterSeconds =
            limit.retryAfterSeconds;
          throw err;
        }
        charged = { ip, sizeBytes };

        return {
          allowedContentTypes: [...SOURCE_PACK_LIMITS.allowedMimeTypes],
          maximumSizeInBytes: sizeBytes,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60_000, // 10 minutes
          tokenPayload: JSON.stringify({ sizeBytes, pathname }),
        };
      },
      // No onUploadCompleted: staging lives in the browser/sessionStorage, and
      // the webhook needs a public callback URL that local/dev often lacks.
    });

    // Keep the rate-limit charge after a successful mint (budget is consumed
    // when a token is issued, not when bytes finish uploading).
    charged = null;
    return NextResponse.json(jsonResponse);
  } catch (error) {
    if (charged) {
      refundOnboardingUploadRateLimit(charged);
      charged = null;
    }
    const message =
      error instanceof Error ? error.message : "Upload token failed";
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 400;
    const retryAfterSeconds =
      typeof error === "object" &&
      error &&
      "retryAfterSeconds" in error &&
      typeof (error as { retryAfterSeconds?: unknown }).retryAfterSeconds ===
        "number"
        ? (error as { retryAfterSeconds: number }).retryAfterSeconds
        : undefined;

    console.error("Onboarding upload token error:", error);
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : undefined,
      },
    );
  }
}

/**
 * Delete a private onboarding blob (orphan cleanup on cancel / remove).
 * Only pathnames under onboarding-uploads/ are allowed.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    if (!blobConfigured()) {
      return NextResponse.json(
        {
          error:
            "Blob storage is not configured (missing BLOB_READ_WRITE_TOKEN).",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { url?: string; pathname?: string };
    const target = body.url || body.pathname;
    if (!target || typeof target !== "string") {
      return NextResponse.json(
        { error: "url or pathname required" },
        { status: 400 },
      );
    }

    toOnboardingUploadPathname(target);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    await del(target, token ? { token } : undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding upload delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
