/**
 * Onboarding file upload → Vercel Blob
 *
 * Accepts multipart/form-data with a single file. Returns the blob URL and
 * metadata on success. Enforces Ruth's Source Pack limits server-side:
 * - 5 files / 50 MiB per IP per hour (rate limiter)
 * - 20 MiB per file
 * - Allowed types: PDF, DOCX, XLSX, CSV, MD, TXT
 */
import { del, put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { SOURCE_PACK_LIMITS } from "@/lib/onboarding/machine";
import { checkOnboardingUploadRateLimit } from "@/lib/onboarding/upload-rate-limit";

const ALLOWED_EXTENSIONS = new Set<string>(SOURCE_PACK_LIMITS.allowedExtensions);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/markdown",
  "text/plain",
]);

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

function clientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate extension
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type not allowed: ${ext}. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}` },
        { status: 400 },
      );
    }

    // Validate MIME type (soft check — browsers can lie)
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      console.warn(`MIME type mismatch: ${file.type} for extension ${ext}`);
    }

    // Validate size
    if (file.size > SOURCE_PACK_LIMITS.maxBytesPerFile) {
      return NextResponse.json(
        { error: `File too large: ${Math.round(file.size / 1024 / 1024)} MiB exceeds 20 MiB limit` },
        { status: 400 },
      );
    }

    const limit = checkOnboardingUploadRateLimit({ ip: clientIp(request), sizeBytes: file.size });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.reason || "Too many uploads. Try again later." },
        {
          status: 429,
          headers: limit.retryAfterSeconds
            ? { "Retry-After": String(limit.retryAfterSeconds) }
            : undefined,
        },
      );
    }

    // User Source Pack files go to the private Blob store (not the public
    // website asset store). Local: BLOB_READ_WRITE_TOKEN. Vercel: OIDC + BLOB_STORE_ID.
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token && !process.env.BLOB_STORE_ID && !process.env.VERCEL_OIDC_TOKEN) {
      return NextResponse.json(
        { error: "Blob storage is not configured (missing BLOB_READ_WRITE_TOKEN)." },
        { status: 503 },
      );
    }

    // Generate a unique path under onboarding-uploads/
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `onboarding-uploads/${timestamp}-${safeFilename}`;

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
      ...(token ? { token } : {}),
    });

    // Client aborted after the put finished — drop the orphan immediately.
    if (request.signal.aborted) {
      await del(blob.url, token ? { token } : undefined).catch(() => undefined);
      return NextResponse.json({ error: "Upload aborted" }, { status: 499 });
    }

    return NextResponse.json({
      success: true,
      blobUrl: blob.url,
      pathname: blob.pathname,
      filename: file.name,
      extension: ext,
      sizeBytes: file.size,
      contentType: blob.contentType,
      access: "private" as const,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Upload aborted" }, { status: 499 });
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
