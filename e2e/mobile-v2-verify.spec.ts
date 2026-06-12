import { test, devices } from "@playwright/test";

// Verifica V2 real desplegada en producción

test.use({ ...devices["iPhone 14"] });

async function setupSilent(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
    } catch {}
  });
}

test("V2-01 plantilla 44 Kizomba (con schema)", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ".qa-screenshots/v2-01-kizomba-inicial.png" });
});

test("V2-02 plantilla 1 Don Filosofín (concierto)", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ".qa-screenshots/v2-02-concierto.png" });
});

test("V2-03 tap en bloque expande", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(4000);
  // Tap en primer bloque
  const block = page.locator("button").filter({ hasText: /TÍTULO/i }).first();
  if (await block.count() > 0) await block.tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/v2-03-block-expandido.png" });
});

test("V2-04 plantilla sin schema (legacy)", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ".qa-screenshots/v2-04-sin-schema.png" });
});
