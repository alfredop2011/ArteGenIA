import { test } from "@playwright/test";
import path from "path";

// Renderiza el mockup HTML estatico para verificar visualmente que se ve
// como esperamos antes de pedir aprobacion al usuario.

test.use({ viewport: { width: 1600, height: 1200 } });

test("mockup-editor-mobile-v1", async ({ page }) => {
  const filePath = path.resolve(__dirname, "../mockups/editor-mobile-v1.html");
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: ".qa-screenshots/mockup-editor-mobile-v1.png", fullPage: true });
});
