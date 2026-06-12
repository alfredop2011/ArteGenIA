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

test("T-04 FAQ tiene 4 preguntas", async ({ page }) => {
  await page.goto("/pricing", { waitUntil: "networkidle" });
  await expect(page.locator("details")).toHaveCount(4);
});
