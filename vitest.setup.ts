import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";

// Mock de localStorage para tests de hooks que persisten
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

// Mock global fetch para tests que NO hacen requests reales
global.fetch = vi.fn();

// Cleanup tras cada test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
