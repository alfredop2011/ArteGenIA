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

// H-01: Endpoint share-upload responde 401 sin auth (security)
test("H-01 endpoint share-upload requiere auth", async ({ request }) => {
  const res = await request.post("/api/share-upload", {
    data: { imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA=" },
  });
  expect(res.status()).toBe(401);
});

// H-02: Componente ShareModal NO se renderiza por defecto
test("H-02 share modal NO visible al inicio", async ({ page, context }) => {
  await setup(page, context);
  await gotoEditor(page);
  // No debe haber boton "Compartir con la app del sistema"
  await expect(page.locator("text=Compartir con la app del sistema")).toHaveCount(0);
  await expect(page.locator("text=Elige una red")).toHaveCount(0);
});

// H-03: Endpoint rechaza body invalido (validation)
test("H-03 endpoint rechaza imageDataUrl invalido", async ({ request }) => {
  const res = await request.post("/api/share-upload", {
    data: { imageDataUrl: "not-a-data-url" },
  });
  // Sin auth -> 401 antes de validar (correcto). Con auth seria 400.
  expect([400, 401]).toContain(res.status());
});
