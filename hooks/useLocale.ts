"use client";
import { useEffect, useState, useCallback } from "react";
import { TRANSLATIONS, type Locale, type TranslationKey } from "@/lib/translations";

/**
 * Hook de internacionalizacion. Solo cubre el home en esta primera pasada.
 *
 * Persistencia: localStorage clave "artegenia-locale".
 * Default: "es" (idioma original del producto).
 *
 * t(key) busca en el diccionario del locale activo. Si no existe la key
 * cae al diccionario "es" como fallback. Si tampoco esta, devuelve la key
 * literal (señal visible al desarrollador de que falta traduccion).
 */

const STORAGE_KEY = "artegenia-locale";
// Evento propio para que TODOS los componentes que usan useLocale se
// actualicen al instante al cambiar el idioma (no solo el que lo cambió).
const LOCALE_EVENT = "artegenia-locale-change";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && stored in TRANSLATIONS) return stored;
  return "es";
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("es");

  // Al montar: sincronizar con storage y escuchar cambios de idioma desde
  // cualquier otro componente (evento propio) o pestaña ("storage").
  useEffect(() => {
    const sync = () => setLocaleState(readStoredLocale());
    sync();
    window.addEventListener(LOCALE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LOCALE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(LOCALE_EVENT)); // notifica al resto de consumidores
    } catch {
      // Modo privado, ignore.
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return TRANSLATIONS[locale][key] ?? TRANSLATIONS.es[key] ?? key;
  }, [locale]);

  return { locale, setLocale, t };
}
