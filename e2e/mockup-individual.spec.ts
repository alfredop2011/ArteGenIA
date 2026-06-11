import { test } from "@playwright/test";
import path from "path";

test.use({ viewport: { width: 480, height: 1000 } });

test("individual iphone screenshots", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../mockups/editor-mobile-v2-real-templates.html");
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(1200);

  const iphones = await page.locator(".device-frame").all();
  for (let i = 0; i < iphones.length; i++) {
    await iphones[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await iphones[i].screenshot({ path: `.qa-screenshots/mockup-iphone-${i + 1}.png` });
  }
});
