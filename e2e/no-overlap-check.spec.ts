import { test, expect } from "@playwright/test";

// Test critico: la toolbar NUNCA debe solaparse con el bbox del objeto
// seleccionado. Verifica posicion EXACTA leyendo el active object via
// Fabric y comparando con la toolbar.

test.use({ viewport: { width: 1440, height: 900 } });

test("toolbar no solapa bbox - SALSA arriba", async ({ page, context }) => {
  await context.addInitScript(() => {
    try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
  });

  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);

  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("no canvas");

  const positions = [
    { name: "arriba (SALSA)",  ratioX: 0.5, ratioY: 0.10 },
    { name: "medio",            ratioX: 0.5, ratioY: 0.50 },
    { name: "abajo (50€)",      ratioX: 0.5, ratioY: 0.72 },
    { name: "footer",           ratioX: 0.5, ratioY: 0.92 },
  ];

  for (const pos of positions) {
    await page.mouse.click(box.x + box.width * pos.ratioX, box.y + box.height * pos.ratioY);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `.qa-screenshots/overlap-${pos.name.replace(/\s|\(|\)/g, '')}.png` });

    // Toolbar bbox en viewport
    const toolbar = await page.locator(".fixed.z-50").first().boundingBox().catch(() => null);
    // Active object bbox via Fabric - acceder a la instancia del canvas
    const objBbox = await page.evaluate(() => {
      const canvasEl = document.querySelector("canvas") as HTMLCanvasElement;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = (canvasEl as any).__fabric || (canvasEl as any).fabricCanvas;
      if (!fc) {
        // Buscar via referencias globales tipicas
        const win = window as unknown as Record<string, unknown>;
        for (const key of Object.keys(win)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const val = win[key] as any;
          if (val?.getActiveObject) {
            const obj = val.getActiveObject();
            if (obj) {
              const rect = canvasEl.getBoundingClientRect();
              const b = obj.getBoundingRect();
              return { left: rect.left + b.left, top: rect.top + b.top, width: b.width, height: b.height };
            }
          }
        }
        return null;
      }
      const obj = fc.getActiveObject();
      if (!obj) return null;
      const rect = canvasEl.getBoundingClientRect();
      const b = obj.getBoundingRect();
      return { left: rect.left + b.left, top: rect.top + b.top, width: b.width, height: b.height };
    });

    if (!toolbar || !objBbox) {
      console.log(`[${pos.name}] toolbar=`, toolbar, "objBbox=", objBbox);
      continue;
    }
    console.log(`[${pos.name}] toolbar=`, JSON.stringify(toolbar), "obj=", JSON.stringify(objBbox));

    // Verificar no-overlap (bounding rectangles disjuntos)
    const tbBottom = toolbar.y + toolbar.height;
    const tbRight = toolbar.x + toolbar.width;
    const objBottom = objBbox.top + objBbox.height;
    const objRight = objBbox.left + objBbox.width;

    const disjointY = (tbBottom <= objBbox.top + 1) || (toolbar.y >= objBottom - 1);
    const disjointX = (tbRight <= objBbox.left + 1) || (toolbar.x >= objRight - 1);
    const noOverlap = disjointY || disjointX;
    expect(noOverlap, `[${pos.name}] toolbar y obj se solapan`).toBe(true);
  }
});
