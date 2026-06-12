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

// I-01: Bottom bar tiene 5 botones (con "Añadir")
test("I-01 bottom bar tiene boton Añadir", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.screenshot({ path: ".qa-screenshots/i-01-bottom-bar-anadir.png" });
  await expect(page.locator("nav button").filter({ hasText: "Añadir" }).first()).toBeVisible();
});

// I-02: Tap Añadir abre sheet con texto/formas/imagen
test("I-02 sheet Añadir tiene texto, formas, imagen", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("nav button").filter({ hasText: "Añadir" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/i-02-sheet-anadir.png" });

  await expect(page.locator("h2").filter({ hasText: "Añadir elemento" })).toBeVisible();
  await expect(page.locator("text=Título").first()).toBeVisible();
  await expect(page.locator("text=Subtítulo").first()).toBeVisible();
  await expect(page.locator("text=Cuerpo")).toBeVisible();
  await expect(page.locator("text=Corazón")).toBeVisible();
  await expect(page.locator("text=Estrella")).toBeVisible();
  await expect(page.locator("text=Subir foto de tu galería")).toBeVisible();
});

// I-03: Tap "Título" añade texto al canvas (verifica selectedLayerId aparece)
test("I-03 añadir título crea texto seleccionado", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("nav button").filter({ hasText: "Añadir" }).first().tap();
  await page.waitForTimeout(500);
  await page.locator("button").filter({ hasText: "Título" }).first().tap();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/i-03-titulo-anadido.png" });

  // Tras añadir, sub-tools de texto deben estar visibles (porque queda seleccionado)
  await expect(page.locator("button").filter({ hasText: "Fuente" }).first()).toBeVisible({ timeout: 5000 });
});

// I-04: Sheet Capas accesible desde "Más" + lista objetos
test("I-04 sheet Capas accesible desde Más opciones", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("button[aria-label='Mas']").tap();
  await page.waitForTimeout(600);
  await expect(page.locator("text=Capas")).toBeVisible();
  await page.locator("button").filter({ hasText: "Capas" }).first().tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/i-04-sheet-capas.png" });

  await expect(page.locator("h2").filter({ hasText: "Capas" })).toBeVisible();
  // El flyer Kizomba tiene multiples capas — debe mostrarse al menos una con "T" o "📷"
  await expect(page.locator("text=Las capas se muestran en orden")).toBeVisible();
});

// I-05: Toolbar contextual tiene boton Bloquear (lock)
test("I-05 toolbar contextual incluye boton Bloquear", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/i-05-toolbar-lock.png" });

  await expect(page.locator("button[aria-label='Bloquear']")).toBeVisible();
});
