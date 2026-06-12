import { test, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

// Screenshot del ShareModal forzando state via React DevTools no es trivial.
// En su lugar, renderizamos manualmente el HTML que produce con todas las
// redes sociales para capturar el aspecto visual final.
test("Screenshot ShareModal visual", async ({ page, context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
    window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
  });
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // Click Exportar abre sheet
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(600);
  await page.screenshot({ path: ".qa-screenshots/h-export-sheet.png" });
});
