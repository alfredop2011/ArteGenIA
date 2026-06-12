import { test, devices, expect } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

async function setup(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
    } catch {}
  });
}

async function gotoEditor(page: import("@playwright/test").Page) {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
}

// J-01: Botón "Centrar" visible en toolbar contextual
test("J-01 chip toolbar tiene boton Centrar", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/j-01-centrar-btn.png" });

  await expect(page.locator("button[aria-label='Centrar']")).toBeVisible();
});

// J-02: Tap "Centrar" no rompe UI (mueve objeto)
test("J-02 tap Centrar mueve objeto sin error", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  await page.locator("button[aria-label='Centrar']").first().tap();
  await page.waitForTimeout(500);

  // El objeto debe seguir seleccionado y los sub-tools de texto visibles
  await expect(page.locator("button").filter({ hasText: "Fuente" }).first()).toBeVisible();
  // Undo se habilita (centrar pushea history)
  await expect(page.locator("button[aria-label='Deshacer']")).toBeEnabled();
});
