import { test, devices } from "@playwright/test";

// ════════════════════════════════════════════════════════════════════════════
//  Auditoría del editor en mobile (iPhone 14). Reproduce 3 issues reportados:
//   1. "El lienzo se mueve" (pan/scroll accidental)
//   2. "No se puede cambiar el tamaño" (resize handle)
//   3. "Opciones no se ven bien" (UI mobile)
// ════════════════════════════════════════════════════════════════════════════

const TEMPLATE_ID = 44; // Kizomba (un template con varios objetos)

test.use({
  ...devices["iPhone 14"],
});

test.describe("Mobile editor audit", () => {

  test("01 estado inicial canvas", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: ".qa-screenshots/mobile-editor-01-initial.png", fullPage: true });
  });

  test("02 tap en texto - toolbar contextual", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);
    // Tap aproximadamente en el centro del canvas para seleccionar un objeto
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: ".qa-screenshots/mobile-editor-02-tap-center.png", fullPage: true });
  });

  test("03 viewport completo con dock", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);
    // Solo viewport, no fullPage — para ver lo que el usuario ve realmente
    await page.screenshot({ path: ".qa-screenshots/mobile-editor-03-viewport.png" });
  });

  test("04 abrir dock - texto", async ({ page, context }) => {
    await context.addInitScript(() => {
      try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);
    // Buscar boton de texto en el dock inferior - usar selector mas inclusivo
    const textButton = page.locator('button[title*="Texto" i], button[title*="text" i]').first();
    if (await textButton.count() > 0) {
      await textButton.tap();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: ".qa-screenshots/mobile-editor-04-dock-tap.png" });
  });

  test("05 properties panel via tap object", async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
        window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
      } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);
    // Tap en el TITULO grande del flyer (Kizomba) — esta arriba
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      // Tap arriba (donde esta el titulo grande)
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.18);
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: ".qa-screenshots/mobile-editor-05-selected.png" });
  });

  test("06 tap shape (forma)", async ({ page, context }) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
        window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
      } catch {}
    });
    await page.goto(`/editor/${TEMPLATE_ID}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000);
    // Tap en imagen del medio (cuerpos bailando)
    const canvas = page.locator("canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.45);
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: ".qa-screenshots/mobile-editor-06-shape.png" });
  });
});
