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

async function gotoFiltrosImagen(page: import("@playwright/test").Page) {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.65, box.y + box.height * 0.4);
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Filtros" }).first().tap();
  await page.waitForTimeout(500);
}

// L-01: Sub-tool Filtros muestra ajuste fino + rotacion + flip
test("L-01 filtros tiene ajuste fino + rotar + flip", async ({ page, context }) => {
  await setup(page, context);
  await gotoFiltrosImagen(page);
  await page.screenshot({ path: ".qa-screenshots/l-01-imagen-avanzado.png" });

  await expect(page.locator("text=Presets")).toBeVisible();
  await expect(page.locator("text=Ajuste fino")).toBeVisible();
  await expect(page.locator("text=Brillo")).toBeVisible();
  await expect(page.locator("text=Contraste")).toBeVisible();
  await expect(page.locator("text=Saturación")).toBeVisible();
  await expect(page.locator("text=Rotar / voltear")).toBeVisible();
  await expect(page.locator("text=Rotación")).toBeVisible();
  await expect(page.locator("text=Horizontal").first()).toBeVisible();
  await expect(page.locator("text=Vertical").first()).toBeVisible();
});

// L-02: Tap flip horizontal no rompe UI
test("L-02 flip horizontal no rompe UI", async ({ page, context }) => {
  await setup(page, context);
  await gotoFiltrosImagen(page);
  await page.locator("button").filter({ hasText: "↔ Horizontal" }).first().tap();
  await page.waitForTimeout(500);

  // Sigue editable - sub-tool de imagen visible
  await expect(page.locator("button").filter({ hasText: "Reemplazar" }).first()).toBeVisible();
});
