/**
 * Screenshot + keyboard-focus verification for receiving-wall.
 * Usage: node e2e/receiving-wall-screenshots.mjs
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const OUT = "/tmp";

async function openExpandedLetter(page) {
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
  await page.waitForTimeout(300);
}

/** Tab until activeElement matches namePattern (button text or aria-label). */
async function tabToButton(page, namePattern, maxTabs = 40) {
  await page.evaluate(() => {
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
  });
  const re = new RegExp(namePattern, "i");
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const match = await page.evaluate((source) => {
      const el = document.activeElement;
      if (!el || el.tagName !== "BUTTON") return false;
      const text = el.textContent?.trim() ?? "";
      const label = el.getAttribute("aria-label") ?? "";
      const pattern = new RegExp(source, "i");
      return pattern.test(text) || pattern.test(label);
    }, namePattern);
    if (match) return;
  }
  throw new Error(`Could not Tab to button matching: ${namePattern}`);
}

function pixelDiffReport(baselinePath, focusedPath, focusBox, controlBox) {
  const py = `
from PIL import Image
import json, sys

def extrema(a, b, box):
    min_rgb = [255, 255, 255]
    max_rgb = [0, 0, 0]
    x0, y0, w, h = box
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            pa = a.getpixel((x, y))
            pb = b.getpixel((x, y))
            d = [abs(pa[i] - pb[i]) for i in range(3)]
            min_rgb = [min(min_rgb[i], d[i]) for i in range(3)]
            max_rgb = [max(max_rgb[i], d[i]) for i in range(3)]
    return {"min": min_rgb, "max": max_rgb}

baseline = Image.open(sys.argv[1]).convert("RGB")
focused = Image.open(sys.argv[2]).convert("RGB")
focus = json.loads(sys.argv[3])
control = json.loads(sys.argv[4])
print(json.dumps({
    "focusRegion": extrema(baseline, focused, focus),
    "controlRegion": extrema(baseline, focused, control),
}))
`;
  const out = execFileSync(
    "python3",
    ["-c", py, baselinePath, focusedPath, JSON.stringify(focusBox), JSON.stringify(controlBox)],
    { encoding: "utf8" },
  );
  return JSON.parse(out.trim());
}

async function main() {
  const browser = await chromium.launch();
  const shots = [
    { name: "receiving-wall-1920x1080-zoomed-expanded", width: 1920, height: 1080 },
    { name: "receiving-wall-390x844-mobile-expanded", width: 390, height: 844 },
  ];

  for (const { name, width, height } of shots) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await openExpandedLetter(page);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    await context.close();
    console.log(`Wrote ${OUT}/${name}.png`);
  }

  const baselinePath = `${OUT}/receiving-wall-1920x1080-zoomed-expanded.png`;
  const controlRegion = [1200, 760, 170, 70];

  const focusTargets = [
    { name: "accept-focus", pattern: "^Accept$" },
    { name: "discuss-focus", pattern: "Discuss with Clive" },
    { name: "fold-focus", pattern: "Fold the letter" },
    { name: "record-row-focus", pattern: "Goals \\(long-term\\)" },
    { name: "back-btn-focus", pattern: "The wall" },
    { name: "sit-clive-focus", pattern: "^Sit with Clive" },
  ];

  const report = [];
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await openExpandedLetter(page);

  for (const target of focusTargets) {
    await tabToButton(page, target.pattern);
    const shotPath = `${OUT}/receiving-wall-1920x1080-${target.name}.png`;
    await page.waitForTimeout(200);

    const box = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || !(el instanceof HTMLElement)) return null;
      const r = el.getBoundingClientRect();
      const pad = 12;
      return [
        Math.max(0, Math.floor(r.left - pad)),
        Math.max(0, Math.floor(r.top - pad)),
        Math.ceil(r.width + pad * 2),
        Math.ceil(r.height + pad * 2),
      ];
    });
    if (!box) throw new Error(`No focused element for ${target.name}`);

    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Wrote ${shotPath} (region ${box.join(",")})`);

    const diff = pixelDiffReport(baselinePath, shotPath, box, controlRegion);
    report.push({ target: target.name, region: box, ...diff });
  }

  await context.close();
  await browser.close();

  const reportPath = `${OUT}/receiving-wall-focus-diff-report.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFocus diff report: ${reportPath}`);
  for (const row of report) {
    const fm = row.focusRegion.max.join(",");
    const cm = row.controlRegion.max.join(",");
    console.log(`${row.target}: focus max=(${fm}) control max=(${cm})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
