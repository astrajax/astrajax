/**
 * File an onboarding upload into Workshop Source Documents.
 *
 * The browser calls this straight after a successful client-direct Blob upload,
 * passing only the staging key it just wrote. There is no `onUploadCompleted`
 * webhook on the upload route (local and preview environments lack a public
 * callback URL), so this explicit call is the bridge between Blob staging and
 * the durable Airtable home.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  handleOnboardingSourceDocument,
  type OnboardingSourceDocumentBody,
} from "@/lib/brains/handlers/onboarding-source-document";
import { checkOnboardingFilingRateLimit } from "@/lib/onboarding/upload-rate-limit";
import {
  assertOnboardingUploadExtension,
  toOnboardingUploadPathname,
} from "@/lib/onboarding/upload-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let pathname: string;
  let body: OnboardingSourceDocumentBody;

  try {
    body = (await request.json()) as OnboardingSourceDocumentBody;
    // Only onboarding staging keys are fileable — never an arbitrary URL.
    pathname = toOnboardingUploadPathname(body.pathname || body.blobUrl || "");
    assertOnboardingUploadExtension(pathname);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }

  const limit = checkOnboardingFilingRateLimit({ ip: clientIp(request) });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason || "Too many filings. Try again later." },
      {
        status: 429,
        headers: limit.retryAfterSeconds
          ? { "Retry-After": String(limit.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  try {
    const result = await handleOnboardingSourceDocument(pathname, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Onboarding source document filing error:", error);
    return NextResponse.json(
      {
        mode: "fallback",
        saved: false,
        blobRetained: true,
        error: error instanceof Error ? error.message : "Filing failed",
      },
      { status: 502 },
    );
  }
}
