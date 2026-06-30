import { expect, test } from "@playwright/test";
import { STORY_MODE_STORAGE_KEY } from "../src/lib/command-centre/story-mode";

test.describe("Command centre", () => {
  test("full story shows All platform surfaces heading", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "full");
    }, STORY_MODE_STORAGE_KEY);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "All platform surfaces" })).toBeVisible();
  });

  test("light story shows Core features and room chips", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "light");
    }, STORY_MODE_STORAGE_KEY);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Core features" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clive's study" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Doc's workshop" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pam's desk" })).toBeVisible();
  });

  test("review deep link activates Outstanding actions tab", async ({ page }) => {
    let listUrl = "";
    await page.route("**/api/brains/interactions/list**", async (route) => {
      listUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ interactions: [] }),
      });
    });

    await page.goto("/brain/review?view=actionProposed");

    const outstandingTab = page.getByRole("button", { name: "Outstanding actions" });
    await expect(outstandingTab).toHaveClass(/bg-apricot/);
    await expect(page.getByRole("button", { name: "Needs review" })).not.toHaveClass(/bg-apricot/);

    await expect.poll(() => listUrl).toContain("actionProposed=true");
  });

  test("portrait click navigates to Clive room", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "full");
    }, STORY_MODE_STORAGE_KEY);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/#agent-cast");

    await page.getByRole("link", { name: /Enter Clive's study/i }).click();
    await expect(page).toHaveURL(/\/command\/clive$/);
  });
});
