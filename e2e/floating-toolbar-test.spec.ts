import { test, expect } from "@playwright/test";

// Verifica que el toolbar flotante NUNCA salga del canvas (lienzo).
// Repite el chequeo para objetos en 5 posiciones distintas del flyer
// (top, middle, bottom-left, bottom-center, bottom-right).
// La aseveracion clave: bbox del toolbar contenido en bbox del canvas.

const TEMPLATE_ID = 44;

test.use({ viewport: { width: 1440, height: 900 } });

async function getCanvasRect(page: import("@playwright/test").Page) {
  const canvas = page.locator("canvas").first();
  return await canvas.boundingBox();
}

async function getToolbarRect(page: import("@playwright/test").Page) {
  const fixedZ50 = page.locator(".fixed.z-50").first();
  return await fixedZ50.boundingBox().catch(() => null);
}

async function expectToolbarInsideCanvas(
  page: import("@playwright/test").Page,
  label: string,
) {
  const canvas = await getCanvasRect(page);
  const toolbar = await getToolbarRect(page);
  if (!canvas || !toolbar) {
    console.log(`[${label}] canvas=`, canvas, "toolbar=", toolbar);
    return;
  }
  console.log(`[${label}] canvas=`, JSON.stringify(canvas));
  console.log(`[${label}] toolbar=`, JSON.stringify(toolbar));
  // Verificar contención: toolbar dentro del canvas con margen 2px tolerancia
  expect(toolbar.x).toBeGreaterThanOrEqual(canvas.x - 2);
  expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(canvas.x + canvas.width + 2);
  expect(toolbar.y).toBeGreaterThanOrEqual(canvas.y - 2);
  expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(canvas.y + canvas.height + 2);
}

test("toolbar permanece dentro del canvas en cualquier posicion", async ({ page, context }) => {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
    } catch {}
  });

  await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);

  const box = await getCanvasRect(page);
  if (!box) throw new Error("no canvas");

  const positions = [
    { name: "top",          ratioX: 0.5,  ratioY: 0.18 },
    { name: "middle",       ratioX: 0.5,  ratioY: 0.45 },
    { name: "bottom-left",  ratioX: 0.25, ratioY: 0.78 },
    { name: "bottom-cent",  ratioX: 0.5,  ratioY: 0.85 },
    { name: "bottom-right", ratioX: 0.75, ratioY: 0.78 },
  ];

  for (const pos of positions) {
    await page.mouse.click(box.x + box.width * pos.ratioX, box.y + box.height * pos.ratioY);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `.qa-screenshots/ft-${pos.name}.png` });
    await expectToolbarInsideCanvas(page, pos.name);
  }
});
