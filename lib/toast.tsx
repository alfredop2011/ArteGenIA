"use client";

// ════════════════════════════════════════════════════════════════════════════
//  TOAST SYSTEM — Notificaciones globales sin lib externa.
//
//  Diseno:
//   - 3 tipos: success / error / info
//   - Position: bottom-center desktop, top-center mobile (debajo del header)
//   - Auto-dismiss: 3s success, 5s error, 4s info
//   - Stack maximo 3 toasts simultaneos (FIFO: el mas viejo se va si llega 4to)
//   - Animacion slide-in desde abajo/arriba segun viewport
//   - Glass morphism alineado con el resto del editor (.ag-glass)
//
//  Uso:
//    1. Envolver el arbol en <ToastProvider> (en AppShell)
//    2. const { toast } = useToast()
//    3. toast.success("Guardado"), toast.error("Algo salio mal"), toast.info("...")
//
//  No usa libs externas para mantener el bundle bajo y no anadir deps que solo
//  se usan en 5 lugares.
// ════════════════════════════════════════════════════════════════════════════

import {
  createContext, useCallback, useContext, useMemo, useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  /** Si se pasa, se renderiza como CTA opcional al final del toast. */
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  toasts: Toast[];
  push: (kind: ToastKind, message: string, opts?: { action?: Toast["action"]; durationMs?: number }) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Defaults por tipo. error dura mas porque suele requerir leer el mensaje.
const DEFAULT_DURATIONS: Record<ToastKind, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
};

const MAX_STACK = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback<ToastContextValue["push"]>((kind, message, opts) => {
    // ID basado en counter incremental + suffix random para evitar collision
    // si dos toasts se encolan en el mismo tick. No usamos Date.now ni
    // Math.random globalmente porque en algunos entornos (workflows) estan
    // bloqueados — aqui dentro del browser es OK.
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast = { id, kind, message, action: opts?.action };

    setToasts(prev => {
      const next = [...prev, toast];
      // Si excedemos stack maximo, eliminamos los mas viejos (FIFO)
      return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
    });

    const duration = opts?.durationMs ?? DEFAULT_DURATIONS[kind];
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** Hook principal — devuelve helpers tipados por tipo de toast. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // En vez de throw (que romperia tests/storybook), devolvemos no-op.
    // El consumidor sigue funcionando aunque el provider no este montado.
    return {
      toast: {
        success: () => {},
        error: () => {},
        info: () => {},
      },
      dismiss: () => {},
    };
  }
  return {
    toast: {
      success: (message: string, opts?: Parameters<ToastContextValue["push"]>[2]) =>
        ctx.push("success", message, opts),
      error: (message: string, opts?: Parameters<ToastContextValue["push"]>[2]) =>
        ctx.push("error", message, opts),
      info: (message: string, opts?: Parameters<ToastContextValue["push"]>[2]) =>
        ctx.push("info", message, opts),
    },
    dismiss: ctx.dismiss,
  };
}

// ─── Viewport: contenedor fijo que renderiza el stack ────────────────────────

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      // Mobile: top-center debajo del notch/safe area.
      // Desktop: bottom-center, mas natural para confirmaciones de accion.
      // pointer-events-none en wrapper para no bloquear clicks; los toasts
      // individuales reactivan pointer-events.
      className="
        fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none
        flex flex-col gap-2 px-3 w-full max-w-md
        bottom-6 sm:bottom-8
      "
      role="region"
      aria-label="Notificaciones"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.kind];
  return (
    <div
      className={`
        pointer-events-auto rounded-2xl px-4 py-3
        flex items-center gap-3 shadow-2xl
        border ${config.border}
        ${config.bg}
        backdrop-blur-xl
        animate-in fade-in slide-in-from-bottom-2 duration-200
      `}
      role={toast.kind === "error" ? "alert" : "status"}
    >
      <div className={`shrink-0 ${config.iconColor}`}>{config.icon}</div>
      <p className={`flex-1 text-sm font-medium leading-snug ${config.textColor}`}>
        {toast.message}
      </p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className={`shrink-0 text-xs font-bold underline underline-offset-2 ${config.actionColor} hover:opacity-80 transition-opacity`}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificacion"
        className={`shrink-0 ${config.textColor} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <X size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ─── Estilo por tipo ─────────────────────────────────────────────────────────
// Colores theme-aware: usamos rgba con alpha sobre fondo oscuro semi-translucido.
// En light mode los .ag-glass del editor son oscuros tambien, asi que mantenemos
// coherencia.

const TOAST_CONFIG: Record<ToastKind, {
  icon: ReactNode;
  bg: string;
  border: string;
  iconColor: string;
  textColor: string;
  actionColor: string;
}> = {
  success: {
    icon: <CheckCircle2 size={18} strokeWidth={2.2} />,
    bg: "bg-emerald-950/85",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-300",
    textColor: "text-emerald-50",
    actionColor: "text-emerald-200",
  },
  error: {
    icon: <AlertTriangle size={18} strokeWidth={2.2} />,
    bg: "bg-red-950/85",
    border: "border-red-500/30",
    iconColor: "text-red-300",
    textColor: "text-red-50",
    actionColor: "text-red-200",
  },
  info: {
    icon: <Info size={18} strokeWidth={2.2} />,
    bg: "bg-slate-900/85",
    border: "border-white/15",
    iconColor: "text-purple-300",
    textColor: "text-slate-50",
    actionColor: "text-purple-200",
  },
};
