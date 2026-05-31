import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BLOB_PREFIX = "journey-clips/talk";

/** Matches talk clip filenames — timestamped trims or simple slug names. */
const FILENAME_PATTERN = /^(?:[a-z0-9-]+_\d+-?\d+|[a-z0-9-]+)\.mp4$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!FILENAME_PATTERN.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const range = request.headers.get("range");
  const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;

  const result = await get(`${BLOB_PREFIX}/${filename}`, {
    access: "private",
    ifNoneMatch,
    headers: range ? { Range: range } : undefined,
  });

  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: result.blob.etag },
    });
  }

  const responseHeaders = new Headers({
    "Content-Type": result.blob.contentType ?? "video/mp4",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: result.blob.etag,
    "Accept-Ranges": "bytes",
  });

  const contentLength = result.headers.get("content-length");
  const contentRange = result.headers.get("content-range");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);
  if (contentRange) responseHeaders.set("Content-Range", contentRange);

  const status = contentRange ? 206 : 200;

  return new NextResponse(result.stream, {
    status,
    headers: responseHeaders,
  });
}
