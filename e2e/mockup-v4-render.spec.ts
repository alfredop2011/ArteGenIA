import { test } from "@playwright/test";
import path from "path";

test.use({ viewport: { width: 1500, height: 1200 } });

test("mockup-v4-flow-complete", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../mockups/editor-mobile-v4-flow-complete.html");
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(1200);
  // Full page
  await page.screenshot({ path: ".qa-screenshots/mockup-v4-full.png", fullPage: true });
  // Each step individually
  const frames = await page.locator(".device-frame").all();
  for (let i = 0; i < frames.length; i++) {
    await frames[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await frames[i].screenshot({ path: `.qa-screenshots/mockup-v4-step-${i + 1}.png` });
  }
});
