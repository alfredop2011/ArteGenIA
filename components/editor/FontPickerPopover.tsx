"use client";

// ════════════════════════════════════════════════════════════════════════════
//  FONT PICKER POPOVER
//
//  Sustituye el <select> de fonts del panel lateral por un dropdown custom
//  donde cada opcion se renderiza CON la fuente real. Beneficio: el usuario
//  ve "como se verá" antes de aplicarla, en lugar de aplicar y probar 9 veces.
//
//  Patron tipo Canva/Figma. Sin libs externas. Las fuentes deben estar ya
//  cargadas (font-display: swap) — si la fuente aun no llego de Google Fonts
//  el preview cae al fallback del sistema (degradacion grácil).
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type FontPickerPopoverProps = {
  /** Familia actual (ej. "Montserrat"). */
  value: string;
  /** Lista de fuentes disponibles. */
  fonts: string[];
  /** Callback al seleccionar una nueva. */
  onChange: (font: string) => void;
};

export default function FontPickerPopover({ value, fonts, onChange }: FontPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera o ESC
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(t) &&
        triggerRef.current && !triggerRef.current.contains(t)
      ) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50 hover:border-white/15 transition-colors flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate" style={{ fontFamily: value }}>{value}</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="
            absolute top-full left-0 right-0 mt-1.5 z-50
            max-h-72 overflow-y-auto
            rounded-xl p-1
            bg-slate-950/95 backdrop-blur-xl
            border border-white/[0.08] shadow-2xl
            animate-in fade-in slide-in-from-top-1 duration-150
          "
          role="listbox"
        >
          {fonts.map(font => {
            const active = font === value;
            return (
              <button
                key={font}
                type="button"
                onClick={() => { onChange(font); setOpen(false); }}
                role="option"
                aria-selected={active}
                className={`
                  w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3
                  transition-colors
                  ${active ? "bg-purple-600/20 text-purple-100" : "hover:bg-white/5 text-gray-200"}
                `}
              >
                <div className="min-w-0 flex-1">
                  {/* Preview real con la fuente aplicada — 18px para
                      legibilidad. "Aa" es el patron de muestra estándar. */}
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-lg leading-none"
                      style={{ fontFamily: font }}
                      aria-hidden="true"
                    >
                      Aa
                    </span>
                    <span className="text-[11px] text-gray-500 truncate">{font}</span>
                  </div>
                </div>
                {active && <Check size={14} strokeWidth={2.4} className="shrink-0 text-purple-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
