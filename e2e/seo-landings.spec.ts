import { test, expect } from "@playwright/test";

// S-01: Página índice /flyers carga + muestra 7 categorías
test("S-01 /flyers muestra 7 categorías", async ({ page }) => {
  await page.goto("/flyers", { waitUntil: "networkidle" });
  await expect(page.locator("h1")).toContainText("Flyers");
  // Las 7 categorías
  for (const cat of ["Conciertos", "baile", "Fiestas", "festivales", "Discotecas", "Corporativos", "Galas"]) {
    await expect(page.locator("body")).toContainText(cat, { ignoreCase: true });
  }
});

// S-02: /flyers/conciertos tiene H1 + grid + FAQ
test("S-02 /flyers/conciertos página landing completa", async ({ page }) => {
  await page.goto("/flyers/conciertos", { waitUntil: "networkidle" });
  // H1 con keyword
  await expect(page.locator("h1")).toContainText("concierto", { ignoreCase: true });
  // Breadcrumbs
  await expect(page.locator("body")).toContainText("Inicio");
  // FAQ
  await expect(page.locator("body")).toContainText("Preguntas frecuentes");
  await expect(page.locator("details")).not.toHaveCount(0);
  // CTA "Empezar gratis"
  await expect(page.locator("a").filter({ hasText: "Empezar gratis" }).first()).toBeVisible();
  // JSON-LD structured data
  const ldScripts = await page.locator('script[type="application/ld+json"]').count();
  expect(ldScripts).toBeGreaterThanOrEqual(2); // FAQ + Breadcrumb
});

// S-03: Slug inválido renderiza página not-found (status 404 o 200 con NotFound UI)
test("S-03 /flyers/inexistente no aparece como categoría real", async ({ page }) => {
  const res = await page.goto("/flyers/inexistente-categoria");
  // Next 16 con force-static puede devolver 200 con notFound UI o 404 directo.
  // Lo importante: no muestra contenido de categoría válida.
  expect([200, 404]).toContain(res?.status() ?? 0);
  // No debe mostrar el FAQ schema de categoría
  const body = await page.locator("body").textContent();
  expect(body).not.toContain("Preguntas frecuentes");
});

// S-04: meta title contiene keyword + descripción correcta
test("S-04 meta tags SEO correctos por categoría", async ({ page }) => {
  await page.goto("/flyers/clases-de-baile", { waitUntil: "networkidle" });
  const title = await page.title();
  expect(title).toContain("clases");
  expect(title).toContain("ArteGenIA");

  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  expect(desc).toBeTruthy();
  expect(desc!.length).toBeGreaterThan(80); // SEO description min length
});

// S-05: Sitemap incluye nuevas rutas
test("S-05 sitemap incluye /flyers + /flyers/[slug]", async ({ page }) => {
  const res = await page.goto("/sitemap.xml");
  const body = await res!.text();
  expect(body).toContain("/flyers</loc>");
  expect(body).toContain("/flyers/conciertos");
  expect(body).toContain("/flyers/clases-de-baile");
});
