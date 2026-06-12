import { test, devices } from "@playwright/test";

// Auditoria mobile profunda. Toma screenshots de cada estado relevante
// para que el humano evalue UX visualmente.

test.use({ ...devices["iPhone 14"] });

async function setupSilent(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true");
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
    } catch {}
  });
}

test("M1 - estado inicial", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: ".qa-screenshots/m-01-initial.png" });
});

test("M2 - tap texto", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.12);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/m-02-tap-text.png" });
});

test("M3 - tap imagen central", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.40);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/m-03-tap-image.png" });
});

test("M4 - tap fondo", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  // Esquina donde solo hay color de fondo (gradient)
  if (box) await page.touchscreen.tap(box.x + box.width * 0.05, box.y + box.height * 0.50);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/m-04-tap-bg.png" });
});

test("M5 - sheet texto abierto", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.12);
  await page.waitForTimeout(1500);
  // Tap en boton Texto del dock
  const textTab = page.locator('nav button:has-text("Texto")').first();
  if (await textTab.count() > 0) await textTab.tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/m-05-sheet-text.png" });
});

test("M6 - sheet color abierto", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.12);
  await page.waitForTimeout(1500);
  const colorTab = page.locator('nav button:has-text("Color")').first();
  if (await colorTab.count() > 0) await colorTab.tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/m-06-sheet-color.png" });
});

test("M7 - sheet mas abierto", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.12);
  await page.waitForTimeout(1500);
  const moreTab = page.locator('nav button:has-text("Más")').first();
  if (await moreTab.count() > 0) await moreTab.tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/m-07-sheet-more.png" });
});

test("M8 - mid-bottom (zona donde la toolbar antes tapaba)", async ({ page, context }) => {
  await setupSilent(page, context);
  await page.goto(`/editor/42?format=square`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas", { timeout: 10_000 });
  await page.waitForTimeout(3500);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.72);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: ".qa-screenshots/m-08-bottom-text.png" });
});
