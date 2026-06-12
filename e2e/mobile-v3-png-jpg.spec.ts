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

// PJ-01: Sheet Exportar muestra toggle PNG/JPG
test("PJ-01 sheet Exportar tiene toggle PNG/JPG", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/pj-01-png-default.png" });

  await expect(page.locator("text=Tipo de archivo")).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "PNG" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "JPG" }).first()).toBeVisible();
  // PNG default
  await expect(page.locator("text=PNG sin pérdida")).toBeVisible();
});

// PJ-02: Cambiar a JPG actualiza el texto descriptivo y los botones
test("PJ-02 toggle a JPG cambia textos", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(600);
  // Click en JPG
  await page.locator("button").filter({ hasText: "JPG" }).first().tap();
  await page.waitForTimeout(400);
  await page.screenshot({ path: ".qa-screenshots/pj-02-jpg-selected.png" });

  // Texto descriptivo cambia a JPG
  await expect(page.locator("text=JPG comprimido")).toBeVisible();
  // Botones de descarga ahora dicen JPG
  await expect(page.locator("button").filter({ hasText: "Descargar JPG" }).first()).toBeVisible();
});
