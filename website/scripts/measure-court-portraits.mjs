/**
 * Measure Court left-page portrait centering at given viewport widths.
 * Gates on visible gilt rings (what the eye sees), not invisible hotspot cells.
 * Usage: node scripts/measure-court-portraits.mjs [baseUrl] [outDir]
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.argv[2] || "http://localhost:3000";
const OUT_DIR = process.argv[3] || "/tmp/court-measure-rings";
const WIDTHS = [1280, 1440, 1920];
const HEIGHT = 900;
const MAX_CENTER_OFFSET_PX = 12;
const MAX_GAP_DELTA_PX = 12;

async function measure(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".court-stage__artwork");
    const leftPage = document.querySelector(".platform-court__left-page");
    const cells = [...document.querySelectorAll(".platform-court__portrait-cell")];
    const frameRings = [...document.querySelectorAll(".platform-court__frame-ring--in-cell")];
    const portraitArts = [...document.querySelectorAll(".platform-court__portrait-art--in-cell")];

    if (!stage || !leftPage || cells.length === 0 || frameRings.length === 0) {
      return {
        error: "Missing DOM nodes",
        stage: !!stage,
        leftPage: !!leftPage,
        cells: cells.length,
        rings: frameRings.length,
      };
    }

    const sr = stage.getBoundingClientRect();
    const pageRect = leftPage.getBoundingClientRect();

    const pageLeft = pageRect.left - sr.left;
    const pageRight = pageRect.right - sr.left;
    const pageWidth = pageRect.width;
    const pageCenter = pageLeft + pageWidth / 2;

    const cellRects = cells.map((el) => el.getBoundingClientRect());
    const ringRects = frameRings.map((el) => el.getBoundingClientRect());
    const artRects = portraitArts.map((el) => el.getBoundingClientRect());

    const rosterLeft = Math.min(...cellRects.map((r) => r.left)) - sr.left;
    const rosterRight = Math.max(...cellRects.map((r) => r.right)) - sr.left;

    const ringLeft = Math.min(...ringRects.map((r) => r.left)) - sr.left;
    const ringRight = Math.max(...ringRects.map((r) => r.right)) - sr.left;
    const ringCenter = (ringLeft + ringRight) / 2;

    const artLeft = artRects.length ? Math.min(...artRects.map((r) => r.left)) - sr.left : null;
    const artRight = artRects.length ? Math.max(...artRects.map((r) => r.right)) - sr.left : null;

    const ringLeftGap = ringLeft - pageLeft;
    const ringRightGap = pageRight - ringRight;
    const ringGapDelta = Math.abs(ringLeftGap - ringRightGap);
    const ringCenterOffset = Math.abs(ringCenter - pageCenter);

    const cellLeftGap = rosterLeft - pageLeft;
    const cellRightGap = pageRight - rosterRight;
    const cellGapDelta = Math.abs(cellLeftGap - cellRightGap);

    return {
      stage: { width: sr.width, height: sr.height },
      page: { left: pageLeft, right: pageRight, width: pageWidth, center: pageCenter },
      cells: {
        left: rosterLeft,
        right: rosterRight,
        width: rosterRight - rosterLeft,
        gaps: { left: cellLeftGap, right: cellRightGap, delta: cellGapDelta },
      },
      rings: {
        left: ringLeft,
        right: ringRight,
        width: ringRight - ringLeft,
        center: ringCenter,
        centerOffset: ringCenterOffset,
        gaps: { left: ringLeftGap, right: ringRightGap, delta: ringGapDelta },
      },
      portraitMedia: artLeft != null ? { left: artLeft, right: artRight, width: artRight - artLeft } : null,
      css: {
        inset: getComputedStyle(document.querySelector(".court-stage")).getPropertyValue("--court-left-page-inset").trim(),
        end: getComputedStyle(document.querySelector(".court-stage")).getPropertyValue("--court-left-page-end").trim(),
        ringTransform: getComputedStyle(frameRings[0]).transform,
      },
    };
  });
}

function passFail(metrics) {
  if (metrics.error) return { pass: false, reason: metrics.error };
  const { rings } = metrics;
  if (rings.centerOffset > MAX_CENTER_OFFSET_PX) {
    return {
      pass: false,
      reason: `ring center offset ${rings.centerOffset.toFixed(1)}px > ${MAX_CENTER_OFFSET_PX}px`,
    };
  }
  if (rings.gaps.delta > MAX_GAP_DELTA_PX) {
    return {
      pass: false,
      reason: `ring gap delta ${rings.gaps.delta.toFixed(1)}px > ${MAX_GAP_DELTA_PX}px`,
    };
  }
  return { pass: true, reason: "rings centred in left page" };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = {};
  let allPass = true;

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: HEIGHT } });
    await page.goto(`${BASE_URL}/court`, { waitUntil: "networkidle" });
    await page.waitForSelector(".platform-court__frame-ring--in-cell", { timeout: 30000 });
    await page.waitForTimeout(500);

    const shotPath = path.join(OUT_DIR, `court-${width}.png`);
    await page.locator(".platform-court__left-page").screenshot({ path: shotPath });
    const fullPath = path.join(OUT_DIR, `court-full-${width}.png`);
    await page.screenshot({ path: fullPath, fullPage: false });

    const metrics = await measure(page);
    const verdict = passFail(metrics);
    results[width] = { ...metrics, screenshot: shotPath, verdict };
    if (!verdict.pass) allPass = false;
    await page.close();
  }

  await browser.close();

  const reportPath = path.join(OUT_DIR, "measurements.json");
  await writeFile(reportPath, JSON.stringify(results, null, 2));

  console.log(JSON.stringify(results, null, 2));
  console.log(`\nWrote ${reportPath}`);

  if (!allPass) {
    console.error("\nFAIL — visible rings not centred in left page (see ring centerOffset / gaps.delta).");
    process.exit(1);
  }
  console.log("\nPASS — visible rings centred at all widths.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
