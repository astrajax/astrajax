/**
 * Motion verification — locked arch vs scrolling interior while reading.
 * Captures mid-reading travel frames (content still visible).
 * Usage: node e2e/receiving-wall-scroll-verify.mjs
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const OUT = "/tmp";

function regionDiff(aPath, bPath, box) {
  const py = `
from PIL import Image
import json, sys

def stats(a, b, box):
    x0, y0, w, h = box
    diffs = []
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            pa = a.getpixel((x, y))
            pb = b.getpixel((x, y))
            diffs.append(sum(abs(pa[i]-pb[i]) for i in range(3)))
    return {
        "mean": sum(diffs)/len(diffs) if diffs else 0,
        "max": max(diffs) if diffs else 0,
    }

a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
box = json.loads(sys.argv[3])
print(json.dumps(stats(a, b, box)))
`;
  const out = execFileSync("python3", ["-c", py, aPath, bPath, JSON.stringify(box)], {
    encoding: "utf8",
  });
  return JSON.parse(out.trim());
}

async function openBayWithLongLetter(page) {
  await page.goto(`${BASE}/man/receiving-wall`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const door = page.getByRole("button", { name: /External Context Capture/i });
  await door.waitFor({ state: "visible", timeout: 60000 });
  await door.click();
  await page.waitForTimeout(2000);
  const record = page.getByRole("button", { name: /Goals \(long-term\)/i });
  await record.waitFor({ state: "visible", timeout: 30000 });
  await record.click();
  await page.locator('[id^="letter-"]').waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(400);
  /* Seed letter is one line — extend in-DOM so reading travel has range. */
  await page.evaluate(() => {
    const body = document.querySelector('[class*="letterBody"]');
    if (!body) return;
    body.textContent = `${body.textContent ?? ""}\n\n${"The household keeps this on the wall until a human signs it off. ".repeat(48)}`;
  });
  await page.waitForTimeout(200);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await openBayWithLongLetter(page);

  const settledPath = `${OUT}/rw-scroll-settled.png`;
  await page.screenshot({ path: settledPath, fullPage: false });
  console.log(`Wrote ${settledPath}`);

  const readFrames = [];
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 320);
    await page.waitForTimeout(180);
    const path = `${OUT}/rw-scroll-read-${i + 1}.png`;
    await page.screenshot({ path, fullPage: false });
    readFrames.push(path);
    console.log(`Wrote ${path}`);
  }

  /* Opaque frame mouldings at dolly 1.54 — 1920×1080 (calibrated on frame overlay). */
  const archRegion = [118, 312, 72, 420];
  const rightArchRegion = [1730, 312, 72, 420];
  /* Letter body column — moves during reading travel. */
  const interiorRegion = [680, 520, 360, 220];

  const read1 = `${OUT}/rw-scroll-read-1.png`;
  const read4 = `${OUT}/rw-scroll-read-4.png`;
  const leftArch = regionDiff(read1, read4, archRegion);
  const rightArch = regionDiff(read1, read4, rightArchRegion);
  const interiorDiff = regionDiff(read1, read4, interiorRegion);
  const archStabilityMean = (leftArch.mean + rightArch.mean) / 2;

  const report = {
    archRegion,
    rightArchRegion,
    interiorRegion,
    archStability: { leftMoulding: leftArch, rightMoulding: rightArch, mean: archStabilityMean },
    interiorMotion: interiorDiff,
    ratioInteriorToArch: interiorDiff.mean / Math.max(archStabilityMean, 0.001),
    frames: [settledPath, ...readFrames],
    phase: "reading-travel",
  };

  const reportPath = `${OUT}/receiving-wall-scroll-diff-report.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(
    `Arch stability (read1→read4, mouldings): mean=${archStabilityMean.toFixed(2)} (L=${leftArch.mean.toFixed(2)} R=${rightArch.mean.toFixed(2)})`,
  );
  console.log(
    `Interior motion (read1→read4): mean=${interiorDiff.mean.toFixed(2)} max=${interiorDiff.max}`,
  );

  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/man/receiving-wall`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.click('button:has-text("External")').catch(() => {});
  await mobilePage.waitForTimeout(2000);
  const mobilePath = `${OUT}/rw-scroll-mobile-bay.png`;
  await mobilePage.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Wrote ${mobilePath}`);
  await mobile.close();

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
