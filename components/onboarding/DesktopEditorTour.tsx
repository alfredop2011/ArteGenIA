"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, MousePointer2, Type, Image as ImageIcon, Save, Download,
  X as XIcon, ArrowRight, Check,
} from "lucide-react";

/**
 * Tour de onboarding para el editor desktop. Aparece UNA vez la primera
 * que el user entra al editor (post-login). Diseño tipo "splash" con
 * 4 hints en grid 2x2: las acciones clave del editor.
 *
 * Diferencia con el de mobile:
 *  - Mobile tiene 3 hints porque la interfaz es más simple (sheets)
 *  - Desktop tiene 4 porque añade el sidebar de tools y el toolbar superior
 *
 * Persistencia: localStorage "artegenia-desktop-editor-tour-seen".
 * Reset para volver a verlo:
 *   localStorage.removeItem("artegenia-desktop-editor-tour-seen")
 */

const STORAGE_KEY = "artegenia-desktop-editor-tour-seen";

type Props = {
  /** Si false, el tour no se muestra (ej. el user es admin probando) */
  enabled?: boolean;
};

export default function DesktopEditorTour({ enabled = true }: Props) {
  const [show, setShow] = useState(false);

  // Init lazy: chequeamos storage en mount
  useEffect(() => {
    if (!enabled) return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // UX#11 — Antes 1000ms (se percibía lento). 250ms es suficiente
        // para esperar al primer paint del editor evitando el flash del
        // overlay sobre un canvas a medio montar, sin que el user sienta
        // lentitud.
        const t = setTimeout(() => setShow(true), 250);
        return () => clearTimeout(t);
      }
    } catch {
      // Modo privado / SSR: ignore
    }
  }, [enabled]);

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center backdrop-blur-md p-6"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-3xl rounded-3xl p-6 sm:p-8 relative"
        style={{
          background: "var(--home-bg-soft)",
          border: "1px solid var(--ag-brand-border)",
          boxShadow: "0 0 80px var(--ag-brand-bg)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botón cerrar arriba derecha */}
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
          style={{ color: "var(--home-text-soft)" }}
        >
          <XIcon size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
               style={{ background: "var(--ag-brand-bg)", border: "1px solid var(--ag-brand-border)" }}>
            <Sparkles size={11} strokeWidth={2.5} style={{ color: "var(--ag-brand)" }} />
            <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--ag-brand)" }}>
              4 pasos para empezar
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--home-text)" }}>
            ¡Bienvenido al editor!
          </h2>
          <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
            En 30 segundos sabes cómo crear tu primer flyer.
          </p>
        </div>

        {/* Grid 2x2 con los 4 pasos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Step
            number={1}
            icon={MousePointer2}
            title="Haz click en cualquier elemento"
            desc="Texto, foto o forma. Aparece una barra flotante con las opciones de edición."
            accent="#a855f7"
          />
          <Step
            number={2}
            icon={Type}
            title="Edita textos al instante"
            desc="Doble click sobre cualquier texto y escribes lo que quieras. Cambia tamaño, color, fuente en el panel derecho."
            accent="#ec4899"
          />
          <Step
            number={3}
            icon={ImageIcon}
            title="Añade fotos y formas"
            desc="Usa el sidebar izquierdo: Texto, Fotos, Elementos. O la barra flotante para añadir imágenes sobre una capa."
            accent="#facc15"
          />
          <Step
            number={4}
            icon={Download}
            title="Guarda y descarga"
            desc="Guardar 💾 te lo deja en Mis flyers para editar después. Descargar 📥 te da el PNG en alta calidad."
            accent="#22d3ee"
          />
        </div>

        {/* Tip extra */}
        <div
          className="rounded-xl p-3 mb-5 flex items-start gap-3"
          style={{ background: "var(--ag-warning-bg)", border: "1px solid var(--ag-warning-border)" }}
        >
          <Sparkles size={16} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: "var(--ag-warning)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--ag-warning)" }}>
            <strong>Pro tip:</strong> Usa <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>⌘ Z</kbd>
            {" "}para deshacer y <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>⌘ S</kbd>
            {" "}para guardar. Cualquier cosa la puedes mover, escalar y rotar libremente.
          </p>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={dismiss}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: "var(--home-text-soft)" }}
          >
            No mostrar de nuevo
          </button>
          <button
            onClick={dismiss}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              boxShadow: "0 4px 16px rgba(168,85,247,0.4)",
            }}
          >
            <Check size={14} strokeWidth={2.5} />
            Empezar a diseñar
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────

function Step({
  number, icon: Icon, title, desc, accent,
}: {
  number: number;
  icon: typeof MousePointer2;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex gap-3"
      style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}
    >
      <div className="shrink-0 relative">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}1a`, border: `1px solid ${accent}55`, color: accent }}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
        {/* Badge con numero */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
          style={{ background: accent, color: "#000" }}
        >
          {number}
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold mb-1" style={{ color: "var(--home-text)" }}>
          {title}
        </h3>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--home-text-muted)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// Save icon import workaround (no usado pero referenciado en title)
export { Save };
