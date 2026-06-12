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

async function gotoEditor(page: import("@playwright/test").Page) {
  await page.goto(`/editor/44?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(4000);
}

// M.1-01: Reiniciar y Cambiar formato ya no estan disabled (sin "PRÓXIMO")
test("M-01 Más opciones no muestra PRÓXIMO en Reiniciar/Cambiar formato", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("button[aria-label='Mas']").tap();
  await page.waitForTimeout(600);
  await page.screenshot({ path: ".qa-screenshots/m-01-mas-opciones.png" });

  // Las rows clicables deben tener cursor de boton (son MoreRowLink)
  await expect(page.locator("button").filter({ hasText: "Cambiar formato" })).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Reiniciar plantilla" })).toBeVisible();
  // "Asistente IA" sigue disabled, pero NO los otros 2
  // Verificamos contando PRÓXIMO badges - solo debe haber 1 (Asistente IA)
  const proximos = await page.locator("text=PRÓXIMO").count();
  expect(proximos).toBe(1);
});

// M.1-02: Tap Cambiar formato abre sheet con formatos del template
test("M-02 sheet Cambiar formato muestra grid de formatos", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  await page.locator("button[aria-label='Mas']").tap();
  await page.waitForTimeout(500);
  await page.locator("button").filter({ hasText: "Cambiar formato" }).tap();
  await page.waitForTimeout(700);
  await page.screenshot({ path: ".qa-screenshots/m-02-cambiar-formato.png" });

  await expect(page.locator("h2").filter({ hasText: "Cambiar formato" })).toBeVisible();
  // El formato actual (portrait) debe marcarse como "ACTUAL"
  await expect(page.locator("text=ACTUAL")).toBeVisible();
});
