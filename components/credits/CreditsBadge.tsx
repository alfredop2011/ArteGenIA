"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { trackUpgradeClicked, type UserPlan } from "@/lib/analytics";
import { MONTHLY_GRANT, CREDIT_COST } from "@/lib/credits";

/**
 * Badge de créditos en el header (Fase Z.1).
 * - Muestra balance actual del nuevo sistema unificado.
 * - Plan free: "7 / 10" → user ve cuánto le queda del mensual.
 * - Plan pro/enterprise: "85 / 100" igual.
 * - Hover/tap → popover con fecha de reset + costes por acción (UX#5)
 * - Click → /pricing (CTA conversión).
 *
 * Se sincroniza vía useCredits() que polles al focus.
 */
export function CreditsBadge({ plan }: { plan?: string | null }) {
  const { balance, monthlyGrant, daysUntilReset, loading } = useCredits();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cierra el popover al click fuera.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading) {
    return <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />;
  }

  // Fallback durante el primer render del badge si useCredits aún no ha
  // devuelto monthly_grant: usar la constante de lib/credits (single
  // source of truth) en vez de literales stale.
  const grant = monthlyGrant ?? MONTHLY_GRANT[plan ?? "free"] ?? MONTHLY_GRANT.free;
  const current = balance ?? grant;
  const low = current < grant * 0.2; // <20% restante

  const handleLinkClick = () => {
    // Z.9 — track click en badge del header (puede ser conversion o consulta)
    trackUpgradeClicked({
      source: "header_badge",
      current_plan: (plan ?? "free") as UserPlan,
      current_balance: current,
    });
  };

  // Fecha aproximada de reset (sumar daysUntilReset al now).
  // Si no tenemos dato (anonymous, error), no mostramos fecha.
  const resetDateText = (() => {
    if (daysUntilReset == null) return null;
    if (daysUntilReset === 0) return "Hoy";
    if (daysUntilReset === 1) return "Mañana";
    const future = new Date();
    future.setDate(future.getDate() + daysUntilReset);
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(future);
  })();

  return (
    <div ref={wrapperRef} className="relative">
      {/* El badge ahora es un button — abre/cierra popover. El link al pricing
          está dentro del popover como CTA explícito. */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1.5 sm:gap-2 border rounded-full px-2 sm:px-3 py-1 text-xs transition-colors ${
          low
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
            : "border-ag text-ag-muted hover:bg-ag-card"
        }`}
        aria-label={`${current} de ${grant} créditos disponibles`}
        aria-expanded={open}
      >
        <Zap
          size={14}
          strokeWidth={2.2}
          className="text-amber-500 fill-amber-500"
        />
        <span className="font-bold text-ag-primary">
          {current}
          <span className="hidden sm:inline text-ag-soft font-normal">/{grant}</span>
        </span>
      </button>

      {/* Popover con detalles. Aparece bajo el badge, alineado a la derecha. */}
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl shadow-2xl border p-4 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: "var(--home-card-bg)",
            borderColor: "var(--home-card-border)",
            color: "var(--home-text)",
          }}
        >
          {/* Header con balance grande + estado */}
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-2xl font-black">{current}</span>
              <span className="text-sm text-ag-soft"> / {grant} créditos</span>
            </div>
            {low && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                BAJO
              </span>
            )}
          </div>

          {/* Reset date */}
          {resetDateText && (
            <p className="text-xs text-ag-muted mb-3">
              Se renuevan el <span className="font-semibold text-ag-primary">{resetDateText}</span>
            </p>
          )}

          {/* Costes por acción */}
          <div className="border-t border-ag pt-3 mb-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-ag-soft mb-2">Coste por acción</p>
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between">
                <span className="text-ag-muted">Quitar fondo · descarga PNG/JPG</span>
                <span className="font-semibold text-ag-primary">{CREDIT_COST.quitar_fondo} cr</span>
              </li>
              <li className="flex justify-between">
                <span className="text-ag-muted">Asistente IA · borrador mágico</span>
                <span className="font-semibold text-ag-primary">{CREDIT_COST.asistente_ia} cr</span>
              </li>
              <li className="flex justify-between">
                <span className="text-ag-muted">Generar imagen IA · Capas Mágicas</span>
                <span className="font-semibold text-ag-primary">{CREDIT_COST.capas_magicas} cr</span>
              </li>
              <li className="flex justify-between">
                <span className="text-ag-muted">Descargar PDF imprenta · SVG</span>
                <span className="font-semibold text-ag-primary">{CREDIT_COST.download_pdf} cr</span>
              </li>
            </ul>
          </div>

          {/* CTA al pricing */}
          <Link
            href="/pricing"
            onClick={handleLinkClick}
            className="block w-full text-center py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {low ? "Sube a Pro · más créditos" : "Ver planes"}
          </Link>
        </div>
      )}
    </div>
  );
}
