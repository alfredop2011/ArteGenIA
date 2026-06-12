import { test, expect, devices } from "@playwright/test";

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

// U-01: Free user intenta exportar PDF → modal upgrade aparece
test("U-01 Free user PDF export muestra modal upgrade", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);

  // Abrir sheet Exportar
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(600);

  // Cambiar formato a PDF
  await page.locator("button").filter({ hasText: /^PDF/ }).first().tap();
  await page.waitForTimeout(300);

  // Click Descargar PDF
  await page.locator("button").filter({ hasText: "Descargar PDF" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/u-01-upgrade-pdf.png" });

  // Modal upgrade visible con título y CTAs
  await expect(page.locator("text=Exportar PDF para imprenta es Pro")).toBeVisible();
  await expect(page.locator("a").filter({ hasText: "Subir a Pro ahora" })).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Tal vez después" })).toBeVisible();
});

// U-02: CTA "Subir a Pro" lleva a /pricing
test("U-02 modal CTA enlaza a /pricing", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(500);
  await page.locator("button").filter({ hasText: /^SVG/ }).first().tap();
  await page.waitForTimeout(300);
  await page.locator("button").filter({ hasText: "Descargar SVG" }).first().tap();
  await page.waitForTimeout(600);

  // CTA modal apunta a /pricing
  const cta = page.locator("a").filter({ hasText: "Subir a Pro ahora" });
  await expect(cta).toHaveAttribute("href", "/pricing");
});

// U-03: Botón "Tal vez después" cierra el modal
test("U-03 cerrar modal con 'Tal vez después'", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button").filter({ hasText: "Exportar" }).first().tap();
  await page.waitForTimeout(500);
  await page.locator("button").filter({ hasText: /^PDF/ }).first().tap();
  await page.waitForTimeout(300);
  await page.locator("button").filter({ hasText: "Descargar PDF" }).first().tap();
  await page.waitForTimeout(600);

  // Click "Tal vez después"
  await page.locator("button").filter({ hasText: "Tal vez después" }).tap();
  await page.waitForTimeout(400);
  await expect(page.locator("text=Exportar PDF para imprenta es Pro")).toHaveCount(0);
});
