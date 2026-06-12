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

test("V3-01 estado inicial - canvas grande sin sheets", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ".qa-screenshots/v3-01-inicial.png" });
});

test("V3-02 tap texto - chip toolbar flotante aparece", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // tap arriba en el canvas (texto Kizomba)
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: ".qa-screenshots/v3-02-chip-toolbar.png" });
});

test("V3-03 tap Texto en bottom bar abre sheet", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  // tap en boton "Texto" del bottom bar
  const textoBtn = page.locator("nav button").filter({ hasText: /^Texto$/ }).first();
  await textoBtn.tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/v3-03-sheet-texto.png" });
});

test("V3-04 tap Estilo abre paletas", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const estiloBtn = page.locator("nav button").filter({ hasText: /^Estilo$/ }).first();
  await estiloBtn.tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/v3-04-sheet-estilo.png" });
});

test("V3-05 tap Remix muestra 4 estilos", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const remixBtn = page.locator("nav button").filter({ hasText: /^Remix$/ }).first();
  await remixBtn.tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".qa-screenshots/v3-05-sheet-remix.png" });
});
