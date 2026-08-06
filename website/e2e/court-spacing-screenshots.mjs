/**
 * Court deliberation spacing + DECIDE plaque verification.
 * Usage: node e2e/court-spacing-screenshots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = ".screenshots";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`${BASE}/court`, { waitUntil: "networkidle" });
await page.waitForSelector(".platform-court__plaque-word");

// Intake: CONVENE plaque (sanity check same face box)
await page.screenshot({
  path: `${OUT}/court-fix-convene-plaque-after.png`,
  fullPage: false,
});

// Sample matter → deliberation
await page.click('button:has-text("or hear the sample matter")');
await page.waitForSelector(".platform-court__bicker-feed", { timeout: 15000 });

// Wait for bicker bubbles and all verdict strips (Decide plaque)
await page.waitForSelector('.platform-court__plaque-word:has-text("Decide")', {
  timeout: 30000,
});
await page.waitForTimeout(800);

await page.screenshot({
  path: `${OUT}/court-deliberation-spacing-after.png`,
  fullPage: false,
});

// Crop plaque region for easier review
const plaque = page.locator('button.platform-court__plaque-hotspot:has-text("Decide")');
const box = await plaque.boundingBox();
if (box) {
  await page.screenshot({
    path: `${OUT}/court-fix-decide-plaque-after.png`,
    clip: {
      x: Math.max(0, box.x - 40),
      y: Math.max(0, box.y - 30),
      width: Math.min(1920, box.width + 80),
      height: Math.min(1080, box.height + 60),
    },
  });
}

// Bicker feed crop
const feed = page.locator(".platform-court__bicker-feed");
const feedBox = await feed.boundingBox();
if (feedBox) {
  await page.screenshot({
    path: `${OUT}/court-deliberation-messages-after.png`,
    clip: {
      x: Math.max(0, feedBox.x - 8),
      y: Math.max(0, feedBox.y - 8),
      width: Math.min(1920 - feedBox.x, feedBox.width + 16),
      height: Math.min(1080 - feedBox.y, feedBox.height + 16),
    },
  });
}

console.log(`Screenshots saved under ${OUT}/`);
await browser.close();
