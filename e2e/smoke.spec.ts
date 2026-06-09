import { test, expect } from "@playwright/test";

/**
 * Smoke tests: el mínimo común que tiene que funcionar SIEMPRE.
 *
 * Si alguno de estos falla, el deploy está roto y los usuarios no pueden
 * llegar al producto. Se corren en cada PR antes de mergear (cuando se
 * configure GitHub Actions).
 */

test.describe("Smoke (sin auth)", () => {
  test("home carga correctamente con hero y CTA", async ({ page }) => {
    await page.goto("/");
    // Hero principal visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // CTA explorar plantillas presente
    await expect(page.getByRole("link", { name: /explorar/i }).first()).toBeVisible();
  });

  test("/templates carga con sidebar y grid", async ({ page }) => {
    await page.goto("/templates");
    // Sidebar de filtros
    await expect(page.getByText(/filtros/i).first()).toBeVisible();
    // El título de la sección está
    await expect(page.getByRole("heading", { name: /plantillas/i }).first()).toBeVisible();
    // Al menos un articulo (template card) renderizado tras cargar
    await expect(page.locator("article").first()).toBeVisible({ timeout: 15_000 });
  });

  test("páginas legales accesibles", async ({ page }) => {
    for (const path of ["/privacidad", "/terminos", "/cookies"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("sitemap y robots disponibles", async ({ page }) => {
    const sitemapRes = await page.request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    expect(await sitemapRes.text()).toContain("<urlset");

    const robotsRes = await page.request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    expect(await robotsRes.text()).toContain("Disallow");
  });
});

test.describe("Security headers", () => {
  test("HSTS + CSP + X-Frame-Options aplicados", async ({ page }) => {
    const res = await page.request.get("/");
    const headers = res.headers();
    expect(headers["strict-transport-security"]).toContain("max-age");
    expect(headers["content-security-policy"]).toContain("default-src");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});

test.describe("API protections", () => {
  test("endpoints IA rechazan sin auth (401)", async ({ request }) => {
    const endpoints = [
      ["POST", "/api/generate-bg", { eventType: "concierto" }],
      ["POST", "/api/remove-bg", null], // FormData; sin file basta para que falle pronto
      ["POST", "/api/chat-wizard", { latestUserMessage: "hola", currentEventData: {} }],
      ["POST", "/api/parse-prompt", { prompt: "test" }],
    ] as const;

    for (const [method, url, body] of endpoints) {
      const res = await request.fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        data: body ?? undefined,
      });
      expect(res.status(), `${method} ${url} debería rechazar sin auth`).toBe(401);
    }
  });

  test("/api/segment-person rechaza SSRF a metadata server", async ({ request }) => {
    // Sin auth → 401 antes de validar SSRF. Test confirma que el endpoint
    // existe y rechaza la llamada (no devuelve 500 o 200 con datos).
    const res = await request.post("/api/segment-person", {
      data: {
        imageUrl: "https://169.254.169.254/latest/meta-data/",
        points: [{ x: 0, y: 0 }],
      },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("/api/admin/users rechaza sin auth (403/401)", async ({ request }) => {
    const res = await request.get("/api/admin/users");
    expect([401, 403]).toContain(res.status());
  });
});
