/**
 * Onboarding file upload → Vercel Blob
 *
 * Accepts multipart/form-data with a single file. Returns the blob URL and
 * metadata on success. Enforces Ruth's Source Pack limits:
 * - 5 files max (tracked client-side)
 * - 20 MiB per file
 * - 50 MiB total (tracked client-side across all uploads)
 * - Allowed types: PDF, DOCX, XLSX, CSV, MD, TXT
 */
import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MiB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx", ".csv", ".md", ".txt"]);
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
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large: ${Math.round(file.size / 1024 / 1024)} MiB exceeds 20 MiB limit` },
        { status: 400 },
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
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
