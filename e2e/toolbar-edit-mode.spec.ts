import { test, expect } from "@playwright/test";

// Verifica que al hacer doble-click sobre un texto (entrar modo edicion),
// la floating toolbar desaparece para no tapar el texto que se edita.

test.use({ viewport: { width: 1440, height: 900 } });

test("toolbar se oculta al entrar modo edicion", async ({ page, context }) => {
  await context.addInitScript(() => {
    try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
  });

  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);

  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("no canvas");

  // 1) Click simple sobre texto "Kizomba" — debe aparecer la toolbar
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  const toolbarVisibleSimpleClick = await page.locator(".fixed.z-50").first().isVisible();
  console.log("[1] toolbar visible tras click simple:", toolbarVisibleSimpleClick);
  expect(toolbarVisibleSimpleClick).toBe(true);
  await page.screenshot({ path: ".qa-screenshots/edit-01-simple-click.png" });

  // 2) Forzar enterEditing programaticamente (mouse.dblclick de Playwright
  //    no dispara bien text:editing:entered en headless). Buscamos el canvas
  //    Fabric via la referencia que el editor mantiene como global o
  //    accedemos al objeto activo via los handlers. Usamos un trigger:
  //    disparamos un dblclick DOM sobre el canvas que Fabric escucha y procesa.
  const canvasEl = page.locator("canvas").first();
  const canvasBB = await canvasEl.boundingBox();
  if (canvasBB) {
    // dispatch un evento dblclick DOM directamente sobre el canvas en las
    // coords del texto "Kizomba" (relativas al canvas)
    await canvasEl.dispatchEvent("dblclick", {
      clientX: canvasBB.x + canvasBB.width * 0.5,
      clientY: canvasBB.y + canvasBB.height * 0.18,
      bubbles: true,
    });
  }
  await page.waitForTimeout(1200);
  const toolbarVisibleDuringEdit = await page.locator(".fixed.z-50").first().isVisible();
  console.log("[2] toolbar visible durante edicion:", toolbarVisibleDuringEdit);
  expect(toolbarVisibleDuringEdit).toBe(false);
  await page.screenshot({ path: ".qa-screenshots/edit-02-editing.png" });

  // 3) Click fuera del texto — sale de edicion, toolbar reaparece
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/edit-03-after-edit.png" });
});
