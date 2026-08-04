/**
 * Motion verification — locked arch vs scrolling interior.
 * Captures mid-transition frames and diffs arch moulding vs void regions.
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

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/man/receiving-wall`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const idlePath = `${OUT}/rw-scroll-idle.png`;
  await page.screenshot({ path: idlePath, fullPage: false });
  console.log(`Wrote ${idlePath}`);

  const door = page.getByRole("button", { name: /External Context Capture/i });
  await door.waitFor({ state: "visible", timeout: 60000 });
  await door.click();

  const midFrames = [];
  for (const pct of [0.25, 0.5, 0.75]) {
    await page.waitForTimeout(375);
    const path = `${OUT}/rw-scroll-mid-${Math.round(pct * 100)}.png`;
    await page.screenshot({ path, fullPage: false });
    midFrames.push(path);
    console.log(`Wrote ${path}`);
  }

  await page.waitForTimeout(900);
  const zoomedPath = `${OUT}/rw-scroll-zoomed.png`;
  await page.screenshot({ path: zoomedPath, fullPage: false });
  console.log(`Wrote ${zoomedPath}`);

  const archRegion = [290, 220, 80, 500];
  const rightArchRegion = [1550, 220, 80, 500];
  const interiorRegion = [560, 280, 800, 400];

  const mid50 = `${OUT}/rw-scroll-mid-50.png`;
  const mid75 = `${OUT}/rw-scroll-mid-75.png`;
  const leftArch = regionDiff(mid50, mid75, archRegion);
  const rightArch = regionDiff(mid50, mid75, rightArchRegion);
  const interiorDiff = regionDiff(mid50, mid75, interiorRegion);
  const archStabilityMean = (leftArch.mean + rightArch.mean) / 2;

  const report = {
    archRegion,
    rightArchRegion,
    interiorRegion,
    archStability: { leftMoulding: leftArch, rightMoulding: rightArch, mean: archStabilityMean },
    interiorMotion: interiorDiff,
    ratioInteriorToArch: interiorDiff.mean / Math.max(archStabilityMean, 0.001),
    frames: [idlePath, ...midFrames, zoomedPath],
  };

  const reportPath = `${OUT}/receiving-wall-scroll-diff-report.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(
    `Arch stability (mid50→mid75, mouldings): mean=${archStabilityMean.toFixed(2)} (L=${leftArch.mean.toFixed(2)} R=${rightArch.mean.toFixed(2)})`,
  );
  console.log(
    `Interior motion (mid50→mid75): mean=${interiorDiff.mean.toFixed(2)} max=${interiorDiff.max}`,
  );

  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/man/receiving-wall`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);
  const mobilePath = `${OUT}/rw-scroll-mobile-idle.png`;
  await mobilePage.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Wrote ${mobilePath}`);
  await mobile.close();

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
