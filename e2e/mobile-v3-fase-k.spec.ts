import { test, devices, expect } from "@playwright/test";

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

async function gotoEditorWithTextSelected(page: import("@playwright/test").Page) {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.18);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Estilos" }).first().tap();
  await page.waitForTimeout(500);
}

// K-01: Sub-tool Estilos muestra secciones Sombra y Borde
test("K-01 estilos tiene Sombra y Borde", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditorWithTextSelected(page);
  await page.screenshot({ path: ".qa-screenshots/k-01-estilos-avanzado.png" });

  await expect(page.locator("text=Sombra").first()).toBeVisible();
  await expect(page.locator("text=Borde texto")).toBeVisible();
  await expect(page.locator("text=Interlineado")).toBeVisible();
  await expect(page.locator("text=Espaciado letras")).toBeVisible();
});

// K-02: Preview shadow buttons visible
test("K-02 estilos muestra 4 presets sombra", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditorWithTextSelected(page);

  await expect(page.locator("text=Ninguna")).toBeVisible();
  await expect(page.locator("text=Suave")).toBeVisible();
  await expect(page.locator("text=Fuerte")).toBeVisible();
  await expect(page.locator("text=Glow")).toBeVisible();
});
