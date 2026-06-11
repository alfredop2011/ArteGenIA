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

// E-01: Botón Guardar aparece en header
test("E-01 boton Guardar visible en header", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.screenshot({ path: ".qa-screenshots/e-01-header-guardar.png" });

  await expect(page.locator("button[aria-label='Guardar']")).toBeVisible();
});

// E-02: Mas → muestra "Mis flyers"
test("E-02 sheet Mas tiene Mis flyers", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("button[aria-label='Mas']").first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/e-02-mis-flyers-link.png" });

  await expect(page.locator("text=Mis flyers")).toBeVisible();
});

// E-03: Tap Guardar sin auth NO rompe la UI (no exception, sigue navegable)
test("E-03 Guardar sin auth no rompe UI", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("button[aria-label='Guardar']").first().tap();
  await page.waitForTimeout(500);
  // El editor sigue navegable — el bottom bar global sigue visible
  await expect(page.locator("button").filter({ hasText: "Plantillas" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Foto" }).first()).toBeVisible();
});
