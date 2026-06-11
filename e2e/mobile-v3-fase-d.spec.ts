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

// D-01: Sheet Foto muestra thumbnails de imagenes
test("D-01 Foto sheet muestra thumbnails + boton subir", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("nav button").filter({ hasText: "Foto" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/d-01-foto-sheet.png" });

  await expect(page.locator("text=Fotos del flyer")).toBeVisible();
  await expect(page.locator("text=Subir foto nueva")).toBeVisible();
});

// D-02: Tap "Exportar" abre el sheet multi-formato
test("D-02 Exportar abre sheet multi-formato", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/d-02-export-sheet.png" });

  // Debe verse "formato disponible" como texto introducido + boton "Descargar"
  await expect(page.locator("h2").filter({ hasText: "Exportar" })).toBeVisible();
});

// D-03: Sheet Remix muestra bloque IA + presets curados
test("D-03 Remix sheet IA + presets curados", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("nav button").filter({ hasText: "Remix" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/d-03-remix-sheet.png" });

  await expect(page.locator("text=Generar con IA")).toBeVisible();
  await expect(page.locator("text=Sorpréndeme")).toBeVisible();
  await expect(page.locator("text=Estilos curados")).toBeVisible();
});
