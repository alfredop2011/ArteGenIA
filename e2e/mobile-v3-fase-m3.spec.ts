import { test, devices, expect } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

// M3-01: Primera vez ABRE el onboarding (sin localStorage seen)
test("M3-01 onboarding aparece la primera vez", async ({ page }) => {
  // Sin localStorage previo
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(5500); // 4s carga + 700ms delay del onboarding + margen
  await page.screenshot({ path: ".qa-screenshots/m3-01-onboarding-step-1.png" });

  await expect(page.locator("text=Toca el texto para editarlo")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("button").filter({ hasText: "Siguiente" })).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Saltar" })).toBeVisible();
});

// M3-02: Tap Siguiente avanza al siguiente step
test("M3-02 Siguiente avanza pasos", async ({ page }) => {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(5500);

  await page.locator("button").filter({ hasText: "Siguiente" }).tap();
  await page.waitForTimeout(400);
  await expect(page.locator("text=Añade elementos con el +")).toBeVisible();

  await page.locator("button").filter({ hasText: "Siguiente" }).tap();
  await page.waitForTimeout(400);
  await expect(page.locator("text=Cambia el estilo con 1 tap")).toBeVisible();

  await page.locator("button").filter({ hasText: "Siguiente" }).tap();
  await page.waitForTimeout(400);
  await expect(page.locator("text=Exporta y comparte")).toBeVisible();
  // En el ultimo paso el boton dice "Empezar"
  await expect(page.locator("button").filter({ hasText: "Empezar" })).toBeVisible();
});

// M3-03: Saltar cierra todo y guarda localStorage
test("M3-03 Saltar cierra y persiste", async ({ page }) => {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(5500);

  await page.locator("button").filter({ hasText: "Saltar" }).tap();
  await page.waitForTimeout(400);

  // El overlay debe desaparecer
  await expect(page.locator("text=Toca el texto para editarlo")).toHaveCount(0);
  // localStorage debe tener marca
  const seen = await page.evaluate(() => window.localStorage.getItem("artegenia-v3-onboarding-seen"));
  expect(seen).toBe("1");
});

// M3-04: Si ya se vio, NO aparece
test("M3-04 con localStorage seen, onboarding NO aparece", async ({ page, context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem("artegenia-v3-onboarding-seen", "1");
  });
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(5500);

  await expect(page.locator("text=Toca el texto para editarlo")).toHaveCount(0);
});
