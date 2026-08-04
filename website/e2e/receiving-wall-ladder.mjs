/**
 * Framing ladder — resting bay state at dolly 1.46, 1.54, 1.62 (16:9).
 * Usage: node e2e/receiving-wall-ladder.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const OUT = "/tmp";
const LADDER = [1.46, 1.54, 1.62];

async function captureLadder(browser, dolly) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/man/receiving-wall?dolly=${dolly}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const door = page.getByRole("button", { name: /External Context Capture/i });
  await door.waitFor({ state: "visible", timeout: 60000 });
  await door.click();
  await page.waitForTimeout(2200);

  const path = `${OUT}/rw-lock-${dolly.toFixed(2)}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`Wrote ${path}`);
  await context.close();
  return path;
}

async function main() {
  const browser = await chromium.launch();
  for (const dolly of LADDER) {
    await captureLadder(browser, dolly);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
