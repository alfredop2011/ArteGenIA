"use client";

// ════════════════════════════════════════════════════════════════════════════
//  MOBILE FLOATING TOOLBAR
//
//  Mini barra contextual sobre el objeto seleccionado en mobile. NO duplica
//  el bottom sheet (que tiene contenido detallado) — aporta acciones rapidas
//  con 1 tap sin tener que abrir un sheet.
//
//  Acciones:
//   - Bring forward (↑)
//   - Send back (↓)
//   - Duplicate
//   - Delete
//
//  Posicionamiento:
//   - Coords absolutas en viewport calculadas por el padre (MobileEditor)
//   - Transform translate(-50%, -100%) → la barra queda ARRIBA del punto y
//   - Si y está cerca del top, MobileEditor decide poner debajo del bbox
//
//  Se renderiza fixed con z-index alto. Backdrop NO (no queremos ocultar el
//  objeto que se esta editando).
// ════════════════════════════════════════════════════════════════════════════

import { ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react";

type Props = {
  visible: boolean;
  x: number; // centro X en viewport coords
  y: number; // bottom Y en viewport coords (transform -100% lo sube)
  onBringForward: () => void;
  onSendBackward: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export default function MobileFloatingToolbar({
  visible, x, y, onBringForward, onSendBackward, onDuplicate, onDelete,
}: Props) {
  if (!visible) return null;
  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
    >
      <div
        className="
          pointer-events-auto flex items-center gap-1
          bg-[#1a1a26]/95 backdrop-blur-md border border-purple-500/30
          rounded-2xl px-1.5 py-1 shadow-2xl shadow-purple-900/40
          animate-in fade-in slide-in-from-bottom-1 duration-150
        "
      >
        <ToolbarBtn onClick={onBringForward} ariaLabel="Traer adelante">
          <ChevronUp size={18} strokeWidth={2.4} />
        </ToolbarBtn>
        <ToolbarBtn onClick={onSendBackward} ariaLabel="Enviar atras">
          <ChevronDown size={18} strokeWidth={2.4} />
        </ToolbarBtn>
        <div className="w-px h-6 bg-white/15 mx-0.5" />
        <ToolbarBtn onClick={onDuplicate} ariaLabel="Duplicar">
          <Copy size={16} strokeWidth={2.2} />
        </ToolbarBtn>
        <ToolbarBtn onClick={onDelete} ariaLabel="Eliminar" danger>
          <Trash2 size={16} strokeWidth={2.2} />
        </ToolbarBtn>
      </div>
    </div>
  );
}

function ToolbarBtn({
  onClick, ariaLabel, children, danger,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        w-11 h-11 rounded-xl flex items-center justify-center
        text-gray-300 active:bg-white/15 transition-colors
        ${danger ? "active:text-red-300 active:bg-red-500/15" : ""}
      `}
    >
      {children}
    </button>
  );
}
