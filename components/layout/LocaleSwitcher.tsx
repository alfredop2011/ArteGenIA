"use client";
import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { LOCALES, type Locale } from "@/lib/translations";

// aria-label y title se obtienen via t() para soporte multi-idioma.

/**
 * Dropdown de seleccion de idioma con bandera + nombre nativo.
 *
 * Cierre del dropdown:
 *  - Click fuera (handler en document)
 *  - Escape
 *  - Selecionar un idioma
 */
export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside + Escape para cerrar
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t("a11y.locale.label")}
        title={t("a11y.locale.label")}
        className="h-9 px-2.5 rounded-full flex items-center gap-1.5 transition-colors text-xs font-semibold"
        style={{
          background: "var(--home-card-bg)",
          border: "1px solid var(--home-card-border)",
          color: "var(--home-text)",
        }}
      >
        <Globe size={14} strokeWidth={2} className="text-purple-400" />
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="hidden sm:inline uppercase tracking-wider text-[10px]">{current.code}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[160px] rounded-xl overflow-hidden shadow-xl z-50"
          style={{
            background: "var(--home-bg-soft)",
            border: "1px solid var(--home-card-border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          }}
        >
          {LOCALES.map(l => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className="w-full px-3 py-2 flex items-center gap-2.5 text-xs font-semibold transition-colors hover:opacity-80"
                style={{
                  background: active ? "var(--home-card-hover)" : "transparent",
                  color: "var(--home-text)",
                }}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 text-left">{l.label}</span>
                {active && <Check size={13} strokeWidth={2.5} className="text-purple-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
