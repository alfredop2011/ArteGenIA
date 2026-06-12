import { test, devices, expect } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

async function setup(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
      window.localStorage.setItem("artegenia-v3-onboarding-seen", "1");
    } catch {}
  });
}

async function gotoEditorWithImage(page: import("@playwright/test").Page) {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // Tap en imagen (pareja del medio)
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(800);
}

// G-01: Sub-tool Quitar fondo muestra CTA real (no placeholder)
test("G-01 Quitar fondo muestra CTA real con boton", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditorWithImage(page);
  await page.locator("button").filter({ hasText: "Quitar fondo" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/g-01-quitar-fondo-cta.png" });

  // CTA "Quitar fondo ahora" visible (boton real, no placeholder)
  await expect(page.locator("button").filter({ hasText: "Quitar fondo ahora" })).toBeVisible();
  // El texto antiguo "Próximamente · Pro" NO debe verse
  await expect(page.locator("text=Próximamente · Pro")).toHaveCount(0);
});

// G-02: Tap boton sin auth → toast info (no rompe UI)
test("G-02 Tap quitar fondo sin auth muestra info", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditorWithImage(page);
  await page.locator("button").filter({ hasText: "Quitar fondo" }).first().tap();
  await page.waitForTimeout(500);
  await page.locator("button").filter({ hasText: "Quitar fondo ahora" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/g-02-toast-iniciar-sesion.png" });

  // El boton sigue habilitado (no se quedo en loading porque early return por auth)
  await expect(page.locator("button").filter({ hasText: "Quitar fondo ahora" })).toBeEnabled();
});
