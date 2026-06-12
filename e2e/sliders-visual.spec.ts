import { test, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

async function setup(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
      window.localStorage.setItem("artegenia-v3-onboarding-seen", "1");
    } catch {}
  });
}

// SV-01: Screenshot del sub-tool Tamaño con slider visual
test("SV-01 slider Tamaño visual", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Tamaño" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/sv-01-tamano-slider.png" });
});

// SV-02: Screenshot del sub-tool Estilos con sliders Borde/Interlineado/Espaciado
test("SV-02 estilos sliders visuales", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Estilos" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/sv-02-estilos-sliders.png" });
});

// SV-03: Screenshot del sub-tool Filtros (imagen) con todos los sliders
test("SV-03 filtros sliders ajuste fino visual", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Filtros" }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/sv-03-filtros-sliders.png" });
});
