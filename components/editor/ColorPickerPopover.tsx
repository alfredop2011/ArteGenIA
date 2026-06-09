"use client";

// ════════════════════════════════════════════════════════════════════════════
//  COLOR PICKER POPOVER — reusable para floating toolbar y property panel.
//
//  Diseno:
//   - Trigger: swatch redondo configurable (24-32px)
//   - Popover: 8 recientes + N marca + input type=color + hex input
//   - "Commit on close": el onChangeComplete dispara al cerrar el popover,
//     no en cada move del slider. Evita 100 entries en undo stack.
//   - Recientes persistidos en localStorage por scope (text/shape/bg)
//   - Click fuera o ESC cierra
//   - Sin libs externas
//
//  Uso:
//    <ColorPickerPopover
//      value={textProps.fill}
//      onChange={(c) => applyTextProp("fill", c)}        // live preview
//      onChangeComplete={(c) => pushSnapshot()}          // commit a undo
//      scope="text"
//      brandColors={['#a855f7', '#ec4899']}              // opcional
//    />
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react";
import { Plus } from "lucide-react";

type ColorPickerPopoverProps = {
  /** Color actual en formato hex (#RRGGBB) o rgba. */
  value: string;
  /** Live preview — se llama en cada cambio (para ver el color aplicarse). */
  onChange: (color: string) => void;
  /** Commit final — se llama al cerrar el popover. Usalo para push de undo. */
  onChangeComplete?: (color: string) => void;
  /** Scope para localStorage de recientes (separa text vs shape vs bg). */
  scope?: "text" | "shape" | "background" | "shadow" | "stroke";
  /** Colores de marca de la plantilla. Maximo 10 — los demas se ignoran. */
  brandColors?: string[];
  /** Tamano del trigger (default 28). */
  swatchSize?: number;
  /** Tooltip del trigger. */
  title?: string;
  /** Etiqueta visual opcional al lado del swatch (ej. "Fondo", "Borde"). */
  label?: string;
};

const STORAGE_KEY_PREFIX = "artegenia-recent-colors";
const MAX_RECENT = 8;

// Paleta por defecto si la plantilla no aporta brandColors — colores generales
// utiles para flyers (negro, blanco, primarios saturados, neutros).
const DEFAULT_PALETTE = [
  "#000000", "#ffffff", "#a855f7", "#ec4899",
  "#facc15", "#22d3ee", "#22c55e", "#ef4444",
  "#f97316", "#3b82f6",
];

/** Lectura inicial sincronica de localStorage para evitar un setState en useEffect.
 *  Se ejecuta una vez al montar via lazy initializer de useState. */
function readRecentsFromStorage(scope: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}-${scope}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export default function ColorPickerPopover({
  value,
  onChange,
  onChangeComplete,
  scope = "text",
  brandColors,
  swatchSize = 28,
  title = "Cambiar color",
  label,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  // Lazy initializer: lee localStorage UNA vez al montar, sin setState en effect.
  const [recents, setRecents] = useState<string[]>(() => readRecentsFromStorage(scope));
  // Tracking del color "drafted" — el ultimo color elegido durante esta sesion
  // del popover. Sirve para que onChangeComplete reciba el valor final, no
  // todos los valores intermedios.
  const draftRef = useRef<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // pushRecent debe declararse ANTES de commitAndClose porque commitAndClose
  // lo llama. Si invertimos el orden, eslint marca use-before-define.
  const pushRecent = useCallback((color: string) => {
    setRecents(prev => {
      // Mover al frente si ya existe, sino prepend; recortar a MAX_RECENT
      const normalized = color.toLowerCase();
      const without = prev.filter(c => c.toLowerCase() !== normalized);
      const next = [color, ...without].slice(0, MAX_RECENT);
      if (typeof window !== "undefined") {
        try { window.localStorage.setItem(`${STORAGE_KEY_PREFIX}-${scope}`, JSON.stringify(next)); }
        catch { /* ignore quota errors */ }
      }
      return next;
    });
  }, [scope]);

  const commitAndClose = useCallback(() => {
    setOpen(false);
    const final = draftRef.current;
    if (final && onChangeComplete) {
      onChangeComplete(final);
    }
    // Guardar en recientes si el commit produjo cambio respecto al valor original
    if (final && final !== value) {
      pushRecent(final);
    }
    draftRef.current = null;
  }, [onChangeComplete, value, pushRecent]);

  // ─── Cerrar popover al click fuera o ESC ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        commitAndClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") commitAndClose();
    };
    // Mousedown (no click) para que cierre antes que el sistema procese
    // un eventual click sobre otro picker.
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, commitAndClose]);

  const handleSelect = useCallback((color: string) => {
    draftRef.current = color;
    onChange(color);
  }, [onChange]);

  // Combinar brandColors (si los hay) con paleta default para ofrecer
  // siempre opciones, pero priorizando marca. Sin duplicar colores.
  const palette = (() => {
    const brand = (brandColors ?? []).slice(0, 10);
    const seen = new Set(brand.map(c => c.toLowerCase()));
    const fillers = DEFAULT_PALETTE.filter(c => !seen.has(c.toLowerCase()));
    return [...brand, ...fillers].slice(0, 12);
  })();

  // Hex input — limpiar entrada y validar formato basico antes de aplicar
  const handleHexInput = useCallback((raw: string) => {
    const trimmed = raw.trim();
    // Aceptar #RGB, #RRGGBB, rgb(...), rgba(...). El input live ya valida
    // el formato visual; aqui solo aplicamos si parece valido.
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed) || /^rgba?\(/.test(trimmed)) {
      handleSelect(trimmed);
    }
  }, [handleSelect]);

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            commitAndClose();
          } else {
            draftRef.current = value;
            setOpen(true);
          }
        }}
        title={title}
        aria-label={title}
        aria-expanded={open}
        className="rounded-full border-2 border-white/20 shadow-md transition-transform hover:scale-110 active:scale-95"
        style={{
          width: swatchSize,
          height: swatchSize,
          // Si el color es transparent o invalido, mostramos un checker pattern
          // para que el usuario vea "no color". Generamos via CSS background.
          background: value && value !== "transparent" ? value : "repeating-conic-gradient(#ccc 0 25%, #888 0 50%) 50% / 8px 8px",
          // Sombra interna sutil para "hundir" el color contra el borde
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.3)",
        }}
      />
      {label && (
        <span className="text-[10.5px] font-medium text-gray-300 select-none">{label}</span>
      )}

      {open && (
        <div
          ref={popoverRef}
          className="
            absolute top-full left-0 mt-2 z-50
            w-64 p-3 rounded-2xl
            bg-slate-950/95 backdrop-blur-xl
            border border-white/[0.08] shadow-2xl
            animate-in fade-in slide-in-from-top-1 duration-150
          "
          // Permitir que click dentro del popover no cierre via document listener
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Recientes — solo si hay alguno guardado */}
          {recents.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Recientes</p>
              <div className="grid grid-cols-8 gap-1.5 mb-3">
                {recents.map((c, i) => (
                  <SwatchButton key={`${c}-${i}`} color={c} active={c.toLowerCase() === value.toLowerCase()} onClick={() => handleSelect(c)} />
                ))}
              </div>
            </>
          )}

          {/* Paleta marca + default */}
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {brandColors && brandColors.length > 0 ? "De la plantilla" : "Paleta"}
          </p>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {palette.map((c, i) => (
              <SwatchButton key={`${c}-${i}`} color={c} active={c.toLowerCase() === value.toLowerCase()} onClick={() => handleSelect(c)} />
            ))}
          </div>

          {/* Picker custom + hex input */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <label
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 transition-transform hover:scale-105"
              title="Elegir color personalizado"
            >
              <Plus size={14} strokeWidth={2.5} className="text-white drop-shadow" />
              <input
                type="color"
                // Si value no es hex valido para input color, default a #000000
                value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
                onChange={(e) => handleSelect(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#000000"
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-purple-500/50"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Swatch individual ─────────────────────────────────────────────────────

function SwatchButton({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      aria-label={`Color ${color}`}
      className={`
        aspect-square rounded-lg transition-all
        ${active ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-950 scale-95" : "hover:scale-110 active:scale-95"}
      `}
      style={{
        background: color,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    />
  );
}
