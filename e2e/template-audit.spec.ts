import { test } from "@playwright/test";

// Auditoria visual de plantillas afectadas por el cambio P1.1
// (fontSize 9-10 → 11). Toma screenshot del canvas de cada una para
// verificar que el texto no se salga de su bounding box.
const AFFECTED_IDS = [32, 36, 37, 41, 44, 45, 46, 47];

for (const id of AFFECTED_IDS) {
  test(`tmpl-${id}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    // Marcar el DesktopEditorTour como ya visto ANTES de cargar — si no,
    // el overlay del tour tapa el canvas y los screenshots salen iguales.
    await ctx.addInitScript(() => {
      try {
        window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      } catch { /* ignore */ }
    });
    await page.goto(`/editor/${id}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(3000); // dar tiempo a fonts + Fabric render
    // Screenshot del wrapper del canvas (incluye el rendered flyer completo)
    const canvas = page.locator("canvas").first();
    await canvas.screenshot({ path: `.qa-screenshots/tmpl-${id}.png` });
  });
}
