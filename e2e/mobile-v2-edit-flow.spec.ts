import { test, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

test("V2-edit el input actualiza el canvas", async ({ page, context }) => {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
    } catch {}
  });
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(4500);

  // Screenshot ANTES: muestra "DON FILOSOFÍN"
  await page.screenshot({ path: ".qa-screenshots/v2-edit-01-antes.png" });

  // Tap en el primer bloque (Título)
  const block = page.locator("button").filter({ hasText: /TÍTULO PRINCIPAL/i }).first();
  if (await block.count() > 0) await block.tap();
  await page.waitForTimeout(800);

  // Reemplazar valor del input
  const input = page.locator('input[type="text"]').first();
  await input.tap();
  await input.fill("BAD BUNNY");
  await page.waitForTimeout(1000);

  // Screenshot DESPUÉS: el canvas debe mostrar "BAD BUNNY"
  await page.screenshot({ path: ".qa-screenshots/v2-edit-02-despues.png" });
});
