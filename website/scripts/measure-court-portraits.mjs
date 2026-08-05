/**
 * Measure Court left-page portrait centering at given viewport widths.
 * Usage: node scripts/measure-court-portraits.mjs [baseUrl] [outDir]
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.argv[2] || "http://localhost:3000";
const OUT_DIR = process.argv[3] || "/tmp/court-measure-baseline";
const WIDTHS = [1280, 1440, 1920];
const HEIGHT = 900;

async function measure(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".court-stage__artwork");
    const leftPage = document.querySelector(".platform-court__left-page");
    const cells = [...document.querySelectorAll(".platform-court__portrait-cell")];
    const frameRings = [...document.querySelectorAll(".platform-court__frame-ring--in-cell")];

    if (!stage || !leftPage || cells.length === 0) {
      return { error: "Missing DOM nodes", stage: !!stage, leftPage: !!leftPage, cells: cells.length };
    }

    const sr = stage.getBoundingClientRect();
    const pageRect = leftPage.getBoundingClientRect();

    const pageLeft = pageRect.left - sr.left;
    const pageRight = pageRect.right - sr.left;
    const pageWidth = pageRect.width;

    const cellRects = cells.map((el) => el.getBoundingClientRect());
    const ringRects = frameRings.map((el) => el.getBoundingClientRect());

    const rosterLeft = Math.min(...cellRects.map((r) => r.left)) - sr.left;
    const rosterRight = Math.max(...cellRects.map((r) => r.right)) - sr.left;

    const ringLeft = ringRects.length ? Math.min(...ringRects.map((r) => r.left)) - sr.left : null;
    const ringRight = ringRects.length ? Math.max(...ringRects.map((r) => r.right)) - sr.left : null;

    const leftGap = rosterLeft - pageLeft;
    const rightGap = pageRight - rosterRight;

    return {
      stage: { width: sr.width, height: sr.height },
      page: { left: pageLeft, right: pageRight, width: pageWidth },
      roster: { left: rosterLeft, right: rosterRight, width: rosterRight - rosterLeft },
      rings: ringLeft != null ? { left: ringLeft, right: ringRight, width: ringRight - ringLeft } : null,
      gaps: { left: leftGap, right: rightGap, delta: Math.abs(leftGap - rightGap) },
      css: {
        inset: getComputedStyle(document.querySelector(".court-stage")).getPropertyValue("--court-left-page-inset").trim(),
        end: getComputedStyle(document.querySelector(".court-stage")).getPropertyValue("--court-left-page-end").trim(),
      },
    };
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = {};

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: HEIGHT } });
    await page.goto(`${BASE_URL}/court`, { waitUntil: "networkidle" });
    await page.waitForSelector(".platform-court__portrait-cell", { timeout: 30000 });
    await page.waitForTimeout(500);

    const shotPath = path.join(OUT_DIR, `court-${width}.png`);
    await page.locator(".platform-court__left-page").screenshot({ path: shotPath });
    const fullPath = path.join(OUT_DIR, `court-full-${width}.png`);
    await page.screenshot({ path: fullPath, fullPage: false });

    results[width] = await measure(page);
    results[width].screenshot = shotPath;
    await page.close();
  }

  await browser.close();

  const reportPath = path.join(OUT_DIR, "measurements.json");
  await writeFile(reportPath, JSON.stringify(results, null, 2));

  console.log(JSON.stringify(results, null, 2));
  console.log(`\nWrote ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
