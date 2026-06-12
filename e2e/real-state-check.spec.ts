import { test } from "@playwright/test";

// Test diagnostico: TOMAR SCREENSHOTS de la realidad actual del editor,
// y reportar la posicion exacta del bbox del objeto activo vs la toolbar.

test.use({ viewport: { width: 1440, height: 900 } });

test("diagnostic - toolbar vs bbox positions", async ({ page, context }) => {
  await context.addInitScript(() => {
    try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
  });

  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);

  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("no canvas");

  // Click sobre "SALSA" (texto grande arriba)
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.10);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/diag-01-salsa.png" });

  // Click sobre "PROFE DAMIAN" (medio)
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.50);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/diag-02-profe.png" });

  // Click sobre "BONO MES 50€" (zona inferior)
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.72);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/diag-03-bono.png" });

  // Click sobre el footer (muy abajo)
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.92);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/diag-04-footer.png" });

  // Resumen: posicion de bbox + toolbar de la ultima seleccion
  const result = await page.evaluate(() => {
    const fixedZ50 = document.querySelector(".fixed.z-50");
    const toolbarRect = fixedZ50?.getBoundingClientRect();
    return {
      toolbar: toolbarRect ? { x: toolbarRect.x, y: toolbarRect.y, w: toolbarRect.width, h: toolbarRect.height } : null,
    };
  });
  console.log("[INFO] result:", JSON.stringify(result));
});
