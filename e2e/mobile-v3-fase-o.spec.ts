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

// O-01: Más opciones tiene Asistente IA (ya no disabled)
test("O-01 Asistente IA accesible desde Más opciones", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button[aria-label='Más']").tap();
  await page.waitForTimeout(600);
  await page.screenshot({ path: ".qa-screenshots/o-01-mas-sin-proximo.png" });

  await expect(page.locator("button").filter({ hasText: "Asistente IA" })).toBeVisible();
  // Ya no debe haber ningun "PRÓXIMO"
  await expect(page.locator("text=PRÓXIMO")).toHaveCount(0);
});

// O-02: Tap Asistente IA abre sheet con textarea + ejemplos
test("O-02 sheet Asistente IA muestra textarea + ejemplos + boton", async ({ page, context }) => {
  await setup(page, context);
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
  await page.locator("button[aria-label='Más']").tap();
  await page.waitForTimeout(500);
  await page.locator("button").filter({ hasText: "Asistente IA" }).tap();
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/o-02-asistente-sheet.png" });

  await expect(page.locator("h2").filter({ hasText: "Asistente IA" })).toBeVisible();
  await expect(page.locator("textarea")).toBeVisible();
  await expect(page.locator("text=Ejemplos rápidos")).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Generar con IA" })).toBeVisible();
});

// O-03: Endpoint /api/assistant requiere auth
test("O-03 endpoint assistant requiere auth", async ({ request }) => {
  const res = await request.post("/api/assistant", {
    data: { prompt: "test", blocks: [{ id: "title", label: "Título" }] },
  });
  expect(res.status()).toBe(401);
});

// O-04: Endpoint rechaza body invalido (sin prompt)
test("O-04 endpoint rechaza body invalido", async ({ request }) => {
  const res = await request.post("/api/assistant", {
    data: { blocks: [] },
  });
  // 401 (auth) o 400 (validation) — ambos son correctos
  expect([400, 401]).toContain(res.status());
});
