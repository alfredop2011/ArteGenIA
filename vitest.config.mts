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
    // .claude/worktrees contiene copias del repo de sesiones de agente —
    // sus tests corren contra código stale y dan falsos rojos.
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**", "**/.claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
