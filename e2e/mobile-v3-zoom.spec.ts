import { test, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

async function setup(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
    } catch {}
  });
}

test("Z-01 fit normal", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ".qa-screenshots/z-01-fit-normal.png" });
});

test("Z-02 zoom al editar Profesores (texto pequeño)", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // Abrir sheet de texto
  await page.locator("nav button").filter({ hasText: /^Texto$/ }).first().tap();
  await page.waitForTimeout(400);
  // Tap en bloque Profesores
  const block = page.locator("button").filter({ hasText: /PROFESORES/i }).first();
  await block.tap();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".qa-screenshots/z-02-zoom-profesores.png" });
});

test("Z-03 zoom al editar Título", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("nav button").filter({ hasText: /^Texto$/ }).first().tap();
  await page.waitForTimeout(400);
  const block = page.locator("button").filter({ hasText: /^TÍTULO$/i }).first();
  await block.tap();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: ".qa-screenshots/z-03-zoom-titulo.png" });
});
