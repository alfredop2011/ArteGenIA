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

test("B-01 Tab Estilo abierto con paletas", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const tab = page.locator("nav button").filter({ hasText: /^Estilo$/ }).first();
  await tab.tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/b-01-estilo-paletas.png" });
});

test("B-02 Aplicar paleta cambia canvas", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("nav button").filter({ hasText: /^Estilo$/ }).first().tap();
  await page.waitForTimeout(500);
  // Tap en la segunda paleta (Stage Red)
  const paletteBtns = page.locator("button").filter({ hasText: /Stage Red|Vinyl|Violet/i });
  if (await paletteBtns.first().count() > 0) await paletteBtns.first().tap();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/b-02-paleta-aplicada.png" });
});

test("B-03 Tab Remix abierto con 4 estilos", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("nav button").filter({ hasText: /^Remix$/ }).first().tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/b-03-remix-cards.png" });
});

test("B-04 Aplicar remix Neón cambia canvas", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("nav button").filter({ hasText: /^Remix$/ }).first().tap();
  await page.waitForTimeout(500);
  // Tap en card Neón
  const neonCard = page.locator("button").filter({ hasText: /^Neón/ }).first();
  await neonCard.tap();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/b-04-remix-neon.png" });
});

test("B-05 Tap Exportar abre bottom sheet multi-formato", async ({ page, context }) => {
  await setup(page, context);
  // logged in (mock)
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("supabase.auth.token", "{\"fake\":true}");
    } catch {}
  });
  await page.goto(`/editor/1?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const exportBtn = page.locator("button").filter({ hasText: /^Exportar$/ }).first();
  await exportBtn.tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/b-05-export-sheet.png" });
});
