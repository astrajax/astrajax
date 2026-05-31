#!/usr/bin/env node
/**
 * Uploads the journey timeline talk clips to Vercel Blob under a stable path
 * (journey-clips/talk/<file>) so the site can serve them in production without
 * committing ~240MB of video into git.
 *
 * Prerequisites:
 *   1. A Vercel Blob store exists for the project.
 *   2. BLOB_READ_WRITE_TOKEN is set in the environment (or website/.env.local).
 *
 * Run from the website/ folder:
 *   node scripts/upload-journey-clips-to-blob.mjs
 *
 * On success it prints the value to set as NEXT_PUBLIC_JOURNEY_CLIPS_BASE.
 */

import { readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TALK_DIR = join(__dirname, "..", "public", "video", "journey-clips", "talk");
const BLOB_PREFIX = "journey-clips/talk";

// The 18 clips referenced by src/lib/journey-clips.ts. Keep in sync if that changes.
const FILES = [
  "neanderthal-matthew-fighting.mp4",
  "p01-hero-opener_0013-0102.mp4",
  "flow-scale_0428-0505.mp4",
  "p03-problem_0701-0721.mp4",
  "best-problem-tools_0615-0624.mp4",
  "flow-breaking-point_0751-0814.mp4",
  "p04-boring-layer_0847-0912.mp4",
  "p05-event-after_1113-1237.mp4",
  "p06-staffing-after_1415-1603.mp4",
  "p07-forecasting_1753-1933.mp4",
  "best-outcomes_2128-2158.mp4",
  "p08-foundation-agents_2128-2259.mp4",
  "best-agent-layer_2233-2259.mp4",
  "p09-clive-adoption_2636-2739.mp4",
  "p10-reggie_3011-3104.mp4",
  "p11-trinity_3156-3307.mp4",
  "flow-compounding_3342-3358.mp4",
  "flow-final-lesson_3426-3624.mp4",
  "p12-final-close_3609-3624.mp4",
];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "Missing BLOB_READ_WRITE_TOKEN.\n" +
        "Add it to website/.env.local or export it, then re-run.\n" +
        "Get it from Vercel → Storage → your Blob store → tokens.",
    );
    process.exit(1);
  }

  let base;
  let uploaded = 0;

  for (const file of FILES) {
    const filePath = join(TALK_DIR, file);
    try {
      await access(filePath);
    } catch {
      console.error(`  ✗ missing locally, skipping: ${file}`);
      continue;
    }

    const body = await readFile(filePath);
    const pathname = `${BLOB_PREFIX}/${file}`;
    const blob = await put(pathname, body, {
      access: "private",
      addRandomSuffix: false,
      contentType: "video/mp4",
      allowOverwrite: true,
      multipart: true,
    });

    uploaded += 1;
    console.log(`  ✓ ${file}`);

    // Derive the folder base URL from the first upload (strip the filename).
    if (!base) base = blob.url.slice(0, blob.url.length - file.length - 1);
  }

  console.log(`\nUploaded ${uploaded}/${FILES.length} clips.`);
  console.log(
    "\nYour Blob store is private — clips are served via /api/journey-clips on the site.",
  );
  console.log(
    "Set in Vercel → Settings → Environment Variables (Production + Preview):",
  );
  console.log("  NEXT_PUBLIC_JOURNEY_CLIPS_BASE=/api/journey-clips");
  if (base) {
    console.log(`\n(Blob path prefix: ${BLOB_PREFIX}/)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
