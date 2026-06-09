import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para E2E.
 *
 * Apunta a producción por defecto (no requiere levantar dev server local
 * cada vez). Si quieres probar contra local: PW_BASE_URL=http://localhost:3000
 *
 * Comandos:
 *   npm run test:e2e         → corre headless contra https://artegenia.vercel.app
 *   npm run test:e2e:ui      → abre Playwright UI interactiva
 *   PW_BASE_URL=http://localhost:3000 npm run test:e2e  → contra local
 */
export default defineConfig({
  testDir: "./e2e",
  // Timeout generoso porque algunos flujos cargan IA
  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.PW_BASE_URL || "https://artegenia.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Mobile critical (descomentar cuando se quieran tests de mobile)
    // { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
});
