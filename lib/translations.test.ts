import { describe, it, expect } from "vitest";
import { TRANSLATIONS, LOCALES } from "./translations";

describe("translations integrity", () => {
  it("tiene los 4 locales esperados", () => {
    const codes = LOCALES.map(l => l.code).sort();
    expect(codes).toEqual(["en", "es", "fr", "pt"]);
  });

  it("cada locale tiene el mismo numero de keys (paridad)", () => {
    const counts = Object.values(TRANSLATIONS).map(d => Object.keys(d).length);
    const unique = new Set(counts);
    expect(unique.size).toBe(1); // todos los locales tienen MISMO numero de keys
  });

  it("cada locale tiene exactamente las MISMAS keys (ningun typo)", () => {
    const referenceKeys = new Set(Object.keys(TRANSLATIONS.es));
    for (const [locale, dict] of Object.entries(TRANSLATIONS)) {
      const dictKeys = new Set(Object.keys(dict));
      // Symmetric diff debe ser vacio
      const missing = [...referenceKeys].filter(k => !dictKeys.has(k));
      const extra = [...dictKeys].filter(k => !referenceKeys.has(k));
      expect(missing, `${locale} faltan: ${missing.join(", ")}`).toEqual([]);
      expect(extra, `${locale} sobran: ${extra.join(", ")}`).toEqual([]);
    }
  });

  it("ningun valor esta vacio (todo traducido)", () => {
    for (const [locale, dict] of Object.entries(TRANSLATIONS)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value, `${locale}.${key} esta vacio`).toBeTruthy();
        expect(value.length, `${locale}.${key} esta vacio`).toBeGreaterThan(0);
      }
    }
  });

  it("placeholders {x} consistentes entre locales", () => {
    // Si una key en es tiene {name}, todas las traducciones deberian tenerlo
    // (sino el .replace() del consumer falla silenciosamente)
    const PLACEHOLDER_RE = /\{[a-zA-Z]+\}/g;
    const reference = TRANSLATIONS.es;

    for (const [key, esValue] of Object.entries(reference)) {
      const esPlaceholders = (esValue.match(PLACEHOLDER_RE) ?? []).sort();
      if (esPlaceholders.length === 0) continue;

      for (const [locale, dict] of Object.entries(TRANSLATIONS)) {
        if (locale === "es") continue;
        const k = key as keyof typeof dict;
        const value = dict[k];
        const placeholders = (value.match(PLACEHOLDER_RE) ?? []).sort();
        expect(
          placeholders,
          `${locale}.${key} placeholders no coinciden con es. es=${esPlaceholders.join(",")} ${locale}=${placeholders.join(",")}`,
        ).toEqual(esPlaceholders);
      }
    }
  });
});
