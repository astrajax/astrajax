import { NextResponse, type NextRequest } from "next/server";
import {
  isPlatformPagePath,
  isPublicApiPath,
  isPublicMarketingRequest,
} from "@/lib/public-host";

/**
 * Platform routes stay in the repo for iteration on localhost / *.vercel.app.
 * On astrajax.com the pages redirect home and the platform APIs 404, so email
 * recipients never reach a half-built shell or an ungated endpoint.
 */
export function middleware(request: NextRequest) {
  if (!isPublicMarketingRequest(request.headers)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (isPlatformPagePath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/brain/:path*",
    "/command/:path*",
    "/agents/:path*",
    "/coach/:path*",
    "/court/:path*",
    "/fleet/:path*",
    "/deploy/:path*",
    "/dispatch/:path*",
    "/adoption/:path*",
    "/chapter-1/:path*",
    "/aie-demo/:path*",
  ],
};
