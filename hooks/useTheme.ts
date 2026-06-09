"use client";
import { useEffect, useState, useCallback } from "react";

/**
 * Toggle de tema (dark / light).
 *
 * Estrategia:
 *  - Persistencia en localStorage clave "artegenia-theme"
 *  - Aplica class "theme-dark" / "theme-light" en <html>
 *  - Default: LIGHT (decisión UX: tema claro es más amigable para usuarios
 *    nuevos / B2B / impresiones, dark queda como opción opcional)
 *  - Las variables CSS estan definidas en app/globals.css (:root usa light)
 *
 * NO usamos system preference para evitar flash al cargar: el user elige
 * explicitamente. Si no hay eleccion previa → light.
 */

export type Theme = "dark" | "light";

const STORAGE_KEY = "artegenia-theme";

/** Lee el theme desde localStorage. Devuelve "light" si no hay nada o SSR. */
function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

/** Aplica la class al <html>. Quita la otra para evitar conflictos. */
function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(`theme-${theme}`);
}

export function useTheme() {
  // Estado inicial = lo guardado. En SSR sera "light" (matchea default visual).
  const [theme, setThemeState] = useState<Theme>("light");

  // Al montar: leer storage y sincronizar. Si difiere de SSR, hay un
  // flash brevisimo — aceptable para MVP. Para eliminarlo del todo habria
  // que inyectar script bloqueante en <head>.
  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyThemeClass(stored);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignorar fallos de storage (modo privado, etc.)
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
