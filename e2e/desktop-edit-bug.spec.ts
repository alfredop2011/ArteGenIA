import { test, expect } from "@playwright/test";

// Reproduce bug: usuario reporta que no se pueden modificar elementos
// en desktop tampoco. Toma screenshots de cada paso para diagnosticar.

const TEMPLATE_ID = 44;

test.describe("Desktop edit bug repro", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
  });

  test("01 abre editor + selecciona texto + intenta cambiar tamano", async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
        window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
      } catch {}
    });

    page.on("pageerror", (err) => console.log("[PAGEERROR]", err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log("[CONSOLE ERROR]", msg.text());
    });

    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: ".qa-screenshots/dt-01-initial.png" });

    // Click en el centro del canvas para seleccionar el texto grande Kizomba
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas no encontrado");

    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.2);
    await page.waitForTimeout(800);
    await page.screenshot({ path: ".qa-screenshots/dt-02-text-selected.png" });

    // Verificar si aparecio la floating toolbar
    const toolbar = page.locator('.ag-fab-btn').first();
    const toolbarVisible = await toolbar.isVisible().catch(() => false);
    console.log("[INFO] floating toolbar visible:", toolbarVisible);

    // Ahora ir al panel lateral derecho y modificar el fontSize input
    const fontSizeInputs = page.locator('input[type="number"]');
    const count = await fontSizeInputs.count();
    console.log("[INFO] inputs numericos en panel:", count);

    if (count > 0) {
      await fontSizeInputs.first().click();
      await fontSizeInputs.first().fill("60");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: ".qa-screenshots/dt-03-after-resize.png" });
  });

  test("02 floating toolbar positioning - texto en parte inferior", async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);

    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas no encontrado");

    // Click en parte INFERIOR del canvas (donde se reporta el bug)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.85);
    await page.waitForTimeout(800);
    await page.screenshot({ path: ".qa-screenshots/dt-04-bottom-selected.png", fullPage: true });
  });
});
