"use client";

// ════════════════════════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS MODAL
//
//  Lista todos los atajos del editor agrupados por categoria. Se abre con la
//  tecla "?" (sin modifiers) — patron Notion/Figma/Linear. Cerrar con X, ESC
//  o click en backdrop.
//
//  Los atajos NO se ejecutan desde aqui — solo se documentan. La implementacion
//  real esta en los handlers de keyboard de GeneratedEditor.tsx.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { X } from "lucide-react";

type Shortcut = {
  keys: string[];   // Cada string es una tecla individual; se renderiza como kbd
  label: string;
};

type ShortcutGroup = {
  title: string;
  items: Shortcut[];
};

// Detecta plataforma para mostrar ⌘ vs Ctrl. SSR-safe: si no hay window,
// asumimos Mac (default razonable para diseñadores).
const isMac = typeof window !== "undefined"
  ? /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
  : true;
const MOD = isMac ? "⌘" : "Ctrl";

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Edición",
    items: [
      { keys: [MOD, "S"],         label: "Guardar diseño" },
      { keys: [MOD, "Z"],         label: "Deshacer" },
      { keys: [MOD, "⇧", "Z"],    label: "Rehacer" },
      { keys: [MOD, "D"],         label: "Duplicar elemento" },
      { keys: ["Supr"],            label: "Eliminar elemento" },
    ],
  },
  {
    title: "Capas",
    items: [
      { keys: ["]"], label: "Traer adelante" },
      { keys: ["["], label: "Enviar atrás" },
    ],
  },
  {
    title: "Vista",
    items: [
      { keys: [MOD, "K"], label: "Paleta de comandos" },
      { keys: ["?"],      label: "Mostrar atajos (este panel)" },
    ],
  },
];

export default function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  // ESC cierra
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Atajos de teclado"
    >
      <div className="w-full max-w-lg rounded-3xl overflow-hidden ag-glass border border-white/[0.08] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-black text-white">Atajos de teclado</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Edita más rápido con el teclado</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2.5">{group.title}</h3>
              <div className="space-y-1.5">
                {group.items.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-gray-200">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, i) => (
                        <span key={i}>
                          <kbd className="inline-block px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.10] text-[11px] font-mono font-semibold text-gray-200 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                            {k}
                          </kbd>
                          {i < s.keys.length - 1 && <span className="text-gray-600 text-[10px] mx-1">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <p className="text-[10px] text-gray-500 text-center">
            Pulsa <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] font-mono">?</kbd> para abrir esta ayuda en cualquier momento
          </p>
        </div>
      </div>
    </div>
  );
}
