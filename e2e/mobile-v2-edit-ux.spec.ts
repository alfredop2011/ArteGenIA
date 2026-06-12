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

test("UX-01 estado normal (no edit) - canvas chico, todos los bloques", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ".qa-screenshots/ux-01-normal.png" });
});

test("UX-02 modo edit - canvas grande, solo bloque activo", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // Tap en bloque PROFESORES
  const block = page.locator("button").filter({ hasText: /PROFESORES/i }).first();
  await block.tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/ux-02-editing.png" });
});

test("UX-03 cambiar texto se ve grande en el canvas", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // Tap PROFESORES
  await page.locator("button").filter({ hasText: /PROFESORES/i }).first().tap();
  await page.waitForTimeout(600);
  // Cambiar el valor
  const input = page.locator('input[type="text"]').first();
  await input.fill("Carlos & Lia");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/ux-03-edited.png" });
});
