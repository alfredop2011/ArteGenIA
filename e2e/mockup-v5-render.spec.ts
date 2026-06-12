import { test } from "@playwright/test";
import path from "path";

test.use({ viewport: { width: 1500, height: 1300 } });

test("mockup v5 text sheet", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../mockups/editor-mobile-v5-text-sheet.html");
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/mockup-v5.png", fullPage: true });
  const frames = await page.locator(".frame").all();
  for (let i = 0; i < frames.length; i++) {
    await frames[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await frames[i].screenshot({ path: `.qa-screenshots/mockup-v5-state-${i + 1}.png` });
  }
});
