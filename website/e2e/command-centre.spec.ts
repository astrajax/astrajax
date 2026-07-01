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

  test("portrait click navigates to Doc workshop stage", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "full");
    }, STORY_MODE_STORAGE_KEY);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/#agent-cast");

    await page.getByRole("link", { name: /Enter Doc's workshop/i }).click();
    await expect(page).toHaveURL(/\/command\/doc$/);
    await expect(page.locator(".doc-workshop-hub__label")).toHaveText("Doc's workshop");
    await expect(
      page.getByRole("img", {
        name: /Doc Albright at his steampunk workshop/i,
      }),
    ).toBeVisible();
  });

  test("workshop fleet hotspot opens Trinity build demo through approval to export", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/command/doc");

    await page.getByRole("button", { name: /Design the fleet/i }).click();
    await expect(page).toHaveURL(/\/command\/doc\/build$/);
    await expect(page.getByRole("heading", { name: "Agent build demo" })).toBeVisible();

    await page.getByRole("button", { name: "Continue to brief" }).click();
    await page.getByRole("button", { name: "View Proposer pack" }).click();
    await page.getByRole("button", { name: "Send to Challenger" }).click();
    await page.getByRole("button", { name: "Ready for your approval" }).click();

    await page.getByLabel("Your name").fill("Matthew");
    await page.getByRole("button", { name: /Approve build/i }).click();

    await page.getByRole("button", { name: "View export" }).click({ timeout: 15000 });

    await expect(page.getByText("Auto-save memories")).toBeVisible();
    await expect(page.getByText("false").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Download export JSON/i })).toBeVisible();

    // Regression: revisiting the builder after completion shows the finished log
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByText(/Validator passed/)).toBeVisible();
    await expect(page.getByRole("button", { name: "View export" })).toBeEnabled();
  });
});
