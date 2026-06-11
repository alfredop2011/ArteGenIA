import { test } from "@playwright/test";
import path from "path";

test.use({ viewport: { width: 1700, height: 1300 } });

test("mockup-editor-mobile-v2-real", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../mockups/editor-mobile-v2-real-templates.html");
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".qa-screenshots/mockup-editor-mobile-v2.png", fullPage: true });
});
