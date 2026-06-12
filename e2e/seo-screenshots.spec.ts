import { test, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

test("S-VISUAL flyers index", async ({ page }) => {
  await page.goto("/flyers", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".qa-screenshots/s-flyers-index.png", fullPage: true });
});

test("S-VISUAL flyers/conciertos", async ({ page }) => {
  await page.goto("/flyers/conciertos", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".qa-screenshots/s-flyers-conciertos.png", fullPage: true });
});

test("S-VISUAL flyers/clases-de-baile", async ({ page }) => {
  await page.goto("/flyers/clases-de-baile", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".qa-screenshots/s-flyers-clases.png", fullPage: true });
});
