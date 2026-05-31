import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Next.js on Vercel — no static export; enables API routes for Ask Clive later.
  images: { unoptimized: true },
};

export default nextConfig;
