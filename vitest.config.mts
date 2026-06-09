import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Configuración de Vitest para tests unitarios.
 *
 * - happy-dom para tener DOM en tests de componentes (más rápido que jsdom)
 * - alias @/ → / igual que tsconfig
 * - Solo corre archivos *.test.ts(x) — excluye e2e (esos los corre Playwright)
 *
 * Comandos:
 *   npm test           → corre todos los tests
 *   npm test -- --ui   → abre UI interactiva
 *   npm test -- --watch → modo watch
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
