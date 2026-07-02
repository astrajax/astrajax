import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Next.js on Vercel — no static export; enables API routes for Ask Clive later.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        // Hashless media in /public — safe to cache hard since a rename/replace changes the URL.
        source: "/:path*(png|jpg|jpeg|webp|avif|svg|gif|mp4|mov|webm)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
