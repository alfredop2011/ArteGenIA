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

async function openExport(page: import("@playwright/test").Page) {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(800);
}

// M2-01: Toggle muestra 4 opciones PNG/JPG/PDF/SVG
test("M2-01 toggle tipo archivo tiene PNG/JPG/PDF/SVG", async ({ page, context }) => {
  await setup(page, context);
  await openExport(page);
  await page.screenshot({ path: ".qa-screenshots/m2-01-png-jpg-pdf-svg.png" });

  await expect(page.locator("button").filter({ hasText: /^PNG/ }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: /^JPG/ }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: /^PDF/ }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: /^SVG/ }).first()).toBeVisible();
});

// M2-02: Tap PDF cambia helper text + botón a "Descargar PDF"
test("M2-02 toggle PDF actualiza textos", async ({ page, context }) => {
  await setup(page, context);
  await openExport(page);
  await page.locator("button").filter({ hasText: /^PDF/ }).first().tap();
  await page.waitForTimeout(400);
  await page.screenshot({ path: ".qa-screenshots/m2-02-pdf-selected.png" });

  await expect(page.locator("text=PDF para imprenta")).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Descargar PDF" }).first()).toBeVisible();
});

// M2-03: Tap SVG cambia helper
test("M2-03 toggle SVG actualiza textos", async ({ page, context }) => {
  await setup(page, context);
  await openExport(page);
  await page.locator("button").filter({ hasText: /^SVG/ }).first().tap();
  await page.waitForTimeout(400);
  await page.screenshot({ path: ".qa-screenshots/m2-03-svg-selected.png" });

  await expect(page.locator("text=SVG vectorial")).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Descargar SVG" }).first()).toBeVisible();
});
