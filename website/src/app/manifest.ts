import type { MetadataRoute } from "next";

/**
 * S1 PWA manifest — App Shells pack D3, with the IA brief §8 amendment:
 * start_url is /enter (the state-aware product entrance) now that the
 * state contract has shipped. The installed app IS Modes 2/3; the website
 * remains the public front. Names per open call 1 (Kate's recommendation,
 * provisional until Matthew rules); icons are the provisional logo-mark
 * set on Deep Moss — open call 2 stays with Kathryn/TL.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AstraJax",
    short_name: "AstraJax",
    description: "The AI Adoption Operating System — your household, in its own frame.",
    start_url: "/enter",
    display: "standalone",
    background_color: "#202A1B",
    theme_color: "#202A1B",
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/app-icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
