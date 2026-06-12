import { test } from "@playwright/test";

// Capturar 1 plantilla representativa de cada categoría del catálogo
// para usarla en mockups con bloques editables específicos.
const TEMPLATES = [
  { id: 1,  cat: "concierto" },     // Don Filosofín Live
  { id: 2,  cat: "gala" },          // Evento Premium
  { id: 3,  cat: "fiesta" },        // Bachata Nights
  { id: 4,  cat: "festival" },      // Vibra Fest
  { id: 7,  cat: "club" },          // Neon Night
  { id: 10, cat: "corporativo" },   // Black Tie
  { id: 5,  cat: "clases" },        // Clases de Baile - Neón
];

for (const t of TEMPLATES) {
  test(`tmpl-${t.cat}-${t.id}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await ctx.addInitScript(() => {
      try { window.localStorage.setItem("artegenia-desktop-editor-tour-seen", "true"); } catch {}
    });
    await page.goto(`/editor/${t.id}?format=portrait`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("canvas", { timeout: 10_000 });
    await page.waitForTimeout(2500);
    await page.locator("canvas").first().screenshot({ path: `mockups/tmpl-${t.cat}.png` });
  });
}
