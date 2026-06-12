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

// F-01: Tap en texto + cambio color + Undo habilitado
test("F-01 Undo se habilita tras cambiar color del texto", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  // Estado inicial: Undo deshabilitado
  await expect(page.locator("button[aria-label='Deshacer']")).toBeDisabled();

  // Tap en titulo, abrir sub-tool Color, tap en swatch amarillo
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Color" }).first().tap();
  await page.waitForTimeout(400);
  // El segundo swatch (negro) — tap simple en cualquier color
  await page.locator("button[aria-label^='Color #']").nth(4).tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/f-01-undo-enabled.png" });

  // Boton Deshacer ahora debe estar habilitado
  await expect(page.locator("button[aria-label='Deshacer']")).toBeEnabled({ timeout: 5000 });
});

// F-02: Sub-tool Estilos tiene alineacion
test("F-02 sub-tool Estilos incluye alineacion", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Estilos" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/f-02-estilos-alineacion.png" });

  // Botones de alineacion presentes
  await expect(page.locator("button[aria-label='Alinear a la izquierda']")).toBeVisible();
  await expect(page.locator("button[aria-label='Centrar']")).toBeVisible();
  await expect(page.locator("button[aria-label='Alinear a la derecha']")).toBeVisible();
});

// F-03: Tap en titulo del header abre prompt para renombrar
test("F-03 tap en titulo header abre renombrar", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  // Stub window.prompt antes del tap
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__lastPrompt = null;
    window.prompt = (msg: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lastPrompt = msg;
      return "Mi flyer custom";
    };
  });
  await page.locator("button[aria-label='Renombrar flyer']").tap();
  await page.waitForTimeout(500);
  const promptMsg = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__lastPrompt;
  });
  expect(promptMsg).toBe("Nombre del flyer");
  // Header ahora muestra el nuevo titulo
  await expect(page.locator("h1").filter({ hasText: "Mi flyer custom" })).toBeVisible();
  await page.screenshot({ path: ".qa-screenshots/f-03-renombrar.png" });
});

// F-04: Fondo no se selecciona al tap en area vacia
test("F-04 tap en area vacia (fondo) no selecciona", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return;
  // Tap en zona casi-vacia (esquina superior)
  await page.touchscreen.tap(box.x + box.width * 0.05, box.y + box.height * 0.02);
  await page.waitForTimeout(600);
  await page.screenshot({ path: ".qa-screenshots/f-04-fondo-no-selecciona.png" });

  // El bottom bar global con "Plantillas/Foto/Estilo/Remix" debe seguir visible
  // (si seleccionara el fondo, mostraria sub-tools de forma)
  await expect(page.locator("button").filter({ hasText: "Plantillas" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Remix" }).first()).toBeVisible();
});
