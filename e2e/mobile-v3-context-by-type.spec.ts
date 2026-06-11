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

// CTX-01: tap en TEXTO → sub-tools de texto
test("CTX-01 texto seleccionado muestra sub-tools de texto", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  // Tap en zona del titulo "Kizomba" (~0.18 vertical)
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/ctx-01-texto.png" });

  // Debe verse "Editar" + "Fuente" + "Tamaño" (hasText busca contiene)
  await expect(page.locator("button").filter({ hasText: "Editar" }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator("button").filter({ hasText: "Fuente" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Tamaño" }).first()).toBeVisible();
  // No deben verse los de imagen
  await expect(page.locator("button").filter({ hasText: "Reemplazar" })).toHaveCount(0);
});

// CTX-02: tap en IMAGEN → sub-tools de imagen
test("CTX-02 imagen seleccionada muestra sub-tools de imagen", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  // Tap en zona de las fotos (centro vertical)
  if (box) await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/ctx-02-imagen.png" });

  await expect(page.locator("button").filter({ hasText: "Reemplazar" }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator("button").filter({ hasText: "Recortar" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Filtros" }).first()).toBeVisible();
  // No deben verse los de texto
  await expect(page.locator("button").filter({ hasText: "Fuente" })).toHaveCount(0);
});

// CTX-03: sub-tool Recortar abre 3 opciones (cuadrado/redondeado/círculo)
test("CTX-03 sub-tool Recortar muestra 3 opciones", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Recortar" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/ctx-03-recortar.png" });

  await expect(page.locator("text=Cuadrado")).toBeVisible();
  await expect(page.locator("text=Redondeado")).toBeVisible();
  await expect(page.locator("text=Círculo")).toBeVisible();
});

// CTX-04: sub-tool Filtros muestra presets
test("CTX-04 sub-tool Filtros muestra 5 presets", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Filtros" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/ctx-04-filtros.png" });

  await expect(page.locator("text=Original")).toBeVisible();
  await expect(page.locator("text=B&N")).toBeVisible();
  await expect(page.locator("text=Cálido")).toBeVisible();
  await expect(page.locator("text=Frío")).toBeVisible();
  await expect(page.locator("text=Vintage")).toBeVisible();
});

// CTX-05: tap fuera de imagen y luego en texto cambia sub-tools
test("CTX-05 cambiar de imagen a texto cambia sub-tools", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return;
  // 1) Tap en imagen
  await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(800);
  await expect(page.locator("button").filter({ hasText: "Reemplazar" }).first()).toBeVisible({ timeout: 5000 });

  // 2) Tap en check verde para deseleccionar
  await page.locator("button[aria-label='Listo']").first().tap();
  await page.waitForTimeout(500);

  // 3) Tap en texto (titulo Kizomba ~0.18)
  await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/ctx-05-cambio-imagen-a-texto.png" });

  await expect(page.locator("button").filter({ hasText: "Editar" }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator("button").filter({ hasText: "Reemplazar" })).toHaveCount(0);
});
