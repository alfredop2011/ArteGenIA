import { test } from "@playwright/test";
import path from "path";

test.use({ viewport: { width: 1700, height: 1400 } });

test("mockup-v3-all-categories", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../mockups/editor-mobile-v3-all-categories.html");
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/mockup-v3-all-categories.png", fullPage: true });

  // Snapshots individuales por categoría
  const cards = await page.locator(".category-card").all();
  for (let i = 0; i < cards.length; i++) {
    await cards[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await cards[i].screenshot({ path: `.qa-screenshots/mockup-v3-card-${i + 1}.png` });
  }
});
