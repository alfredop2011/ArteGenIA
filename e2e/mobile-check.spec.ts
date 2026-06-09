import { test } from "@playwright/test";

test("screenshot home mobile", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
  });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.waitForTimeout(2000); // espera animaciones

  await page.screenshot({
    path: ".qa-screenshots/home-mobile-full.png",
    fullPage: true,
  });
});
