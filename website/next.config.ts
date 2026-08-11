import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native Next.js on Vercel — no static export; enables API routes for Ask Clive later.
  images: {
    formats: ["image/avif", "image/webp"],
    // Living Folio painted-scene masters served from the connected public
    // Vercel Blob store; the optimiser produces responsive AVIF/WebP at device
    // size while the full-resolution Blob master stays untouched.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      // Explicit Living Folio public store (canonical master + matte host).
      {
        protocol: "https",
        hostname: "cvu4l5kwtlocutgd.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      // IA brief §1 housekeeping: deliberate destination, not authorisation.
      { source: "/man", destination: "/man/receiving-wall", permanent: false },
    ];
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
