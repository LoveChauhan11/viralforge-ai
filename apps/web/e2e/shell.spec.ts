import { expect, test } from "@playwright/test";

const routes = ["/today", "/create", "/insights", "/library", "/settings"] as const;

test.describe("web shell", () => {
  for (const route of routes) {
    test(`${route} renders brand and primary nav`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText("ViralForge", { exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
      for (const label of ["Today", "Create", "Insights", "Library", "Settings"]) {
        await expect(page.getByRole("navigation").getByRole("link", { name: label })).toBeVisible();
      }
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test("keyboard can focus skip link and nav", async ({ page }) => {
    await page.goto("/today");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeVisible();
  });
});
