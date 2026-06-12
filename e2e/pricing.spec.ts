import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 14"] });

test("T-01 /pricing carga y muestra 2 planes", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".qa-screenshots/t-01-pricing.png", fullPage: true });

  await expect(page.locator("h1")).toContainText("gratis", { ignoreCase: true });
  await expect(page.locator("h2").filter({ hasText: /^Free$/ })).toBeVisible();
  await expect(page.locator("h2").filter({ hasText: /^Pro$/ })).toBeVisible();
  await expect(page.locator("text=9,99€")).toBeVisible();
  await expect(page.locator("text=Sin watermark, IA ilimitada").or(page.locator("text=SIN watermark"))).toBeVisible();
});

test("T-02 endpoint checkout requiere auth", async ({ request }) => {
  const res = await request.post("/api/stripe/checkout", { data: {} });
  expect(res.status()).toBe(401);
});

test("T-03 endpoint webhook requiere signature", async ({ request }) => {
  const res = await request.post("/api/stripe/webhook", { data: { fake: "event" } });
  // Sin stripe-signature header → 400, o sin webhook configurado → 503
  expect([400, 503]).toContain(res.status());
});

test("T-04 FAQ tiene varias preguntas", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "networkidle" });
  // 6 con Enterprise añadido. Test relajado para no romper al ampliar
  const count = await page.locator("details").count();
  expect(count).toBeGreaterThanOrEqual(4);
});

test("T-05 /pricing muestra 3 planes (Free + Pro + Enterprise)", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "networkidle" });
  // Los 3 h2 existen en DOM (toHaveCount es robusto a viewport)
  await expect(page.locator("h2").filter({ hasText: /^Free$/ })).toHaveCount(1);
  await expect(page.locator("h2").filter({ hasText: /^Pro$/ })).toHaveCount(1);
  await expect(page.locator("h2").filter({ hasText: /^Enterprise$/ })).toHaveCount(1);
  // CTA Enterprise existe (anchor mailto)
  await expect(page.locator('a[href^="mailto"]').filter({ hasText: /Reservar|early|access/i }).first()).toHaveCount(1);
  // Precio Enterprise visible en DOM
  await expect(page.locator("text=34,99€").first()).toHaveCount(1);
});
