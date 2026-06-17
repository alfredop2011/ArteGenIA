"use client";

/**
 * Modal de confirmación ANTES de cualquier acción que consume créditos.
 *
 * CRÍTICO de UX: el usuario debe ver explícitamente qué le va a costar antes
 * de hacerlo. Sin esto, reclamos legítimos del tipo "no sabía que me iba a
 * cobrar". El modal ELIMINA esa base.
 *
 * Tres estados visuales:
 *   - normal: muestra balance before → after, botones "Cancelar" / "Confirmar"
 *   - exhausted: muestra "Sin créditos. Sube a Pro" + CTA pricing
 *   - error: fallback genérico (raro)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackCreditsExhausted, trackUpgradeClicked, type AnalyticsModule } from "@/lib/analytics";

export type ConfirmCreditModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  /** Texto descriptivo de la acción que se va a hacer */
  actionLabel: string;
  /** Cuántos créditos cuesta */
  amount: number;
  /** Balance actual */
  balance: number;
  /** Días hasta el próximo reset (para mensaje sin créditos) */
  daysUntilReset?: number;
  /** Z.25 — Detalles de lo que se descarga (solo en confirmaciones de export).
   *  Si están presentes, el modal muestra un bloque de previsualización
   *  con formato + dimensiones + tipo de archivo para que el user sepa
   *  EXACTAMENTE qué obtendrá antes de gastar el crédito. */
  exportDetails?: {
    /** Nombre semántico del formato. Ej: "Post de Instagram" */
    formatName?: string;
    /** Subtítulo del formato. Ej: "Cuadrado, para feed" */
    formatSubtitle?: string;
    /** Dimensiones. Ej: "1080 × 1080 px" */
    dimensions?: string;
    /** Tipo de archivo final. Ej: "PNG" / "JPG" / "PDF" / "SVG" */
    fileType?: string;
  };
};

export function ConfirmCreditModal({
  open, onClose, onConfirm, actionLabel, amount, balance, daysUntilReset, exportDetails,
}: ConfirmCreditModalProps) {
  const [loading, setLoading] = useState(false);
  const insufficient = balance < amount;

  // Z.9 — track credits_exhausted cuando se abre el modal en estado insuficiente
  useEffect(() => {
    if (open && insufficient) {
      trackCreditsExhausted({
        attempted_module: "download_png" as AnalyticsModule,
        attempted_amount: amount,
        current_balance: balance,
        days_until_reset: daysUntilReset ?? 0,
        plan: "free", // si tiene insuficiente, prob es free; análisis posterior puede mejorar
      });
    }
  }, [open, insufficient, amount, balance, daysUntilReset]);

  if (!open) return null;
  const afterBalance = balance - amount;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl bg-[#13131f] border border-white/[0.08] shadow-2xl p-6"
        >
          {insufficient ? (
            /* ─── ESTADO: SIN CRÉDITOS ─────────────────────────── */
            <>
              <div className="text-center mb-5">
                <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center text-amber-300 text-[28px] mb-3">
                  ⚡
                </div>
                <h3 className="text-[18px] font-black mb-2">Sin créditos suficientes</h3>
                <p className="text-[12.5px] text-gray-400 leading-relaxed">
                  Necesitas <span className="font-bold text-white">{amount} créditos</span> para esta acción.
                  Tienes <span className="font-bold text-amber-300">{balance}</span>.
                </p>
                {typeof daysUntilReset === "number" && daysUntilReset > 0 && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    Tus créditos se renuevan en {daysUntilReset} {daysUntilReset === 1 ? "día" : "días"}.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Link
                  href="/pricing"
                  onClick={() => {
                    // Z.9 — track click upgrade desde modal sin créditos
                    trackUpgradeClicked({
                      source: "credits_exhausted_modal",
                      current_plan: "free",
                      current_balance: balance,
                    });
                    onClose();
                  }}
                  className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-[13px] shadow-lg shadow-purple-500/30 hover:opacity-90"
                >
                  Sube a Pro · 100 créditos/mes →
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 font-bold text-[12px] hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            /* ─── ESTADO: CONFIRMACIÓN NORMAL ──────────────────── */
            <>
              <div className="text-center mb-5">
                <div className="inline-flex w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 items-center justify-center text-purple-300 text-[24px] mb-3">
                  ⚡
                </div>
                <h3 className="text-[17px] font-black mb-1">Confirmar acción</h3>
                <p className="text-[12.5px] text-gray-400">{actionLabel}</p>
              </div>

              {/* Z.25 — Bloque de detalles del export (solo en descargas).
                  Muestra qué formato, qué dimensiones, qué tipo de archivo
                  para que el user sepa exactamente qué va a obtener. */}
              {exportDetails && (exportDetails.formatName || exportDetails.dimensions || exportDetails.fileType) && (
                <div className="mb-4 p-3.5 rounded-xl bg-purple-500/[0.06] border border-purple-500/[0.18]">
                  <p className="text-[9.5px] uppercase tracking-widest text-purple-300/70 font-bold mb-2">Vas a descargar</p>
                  <div className="space-y-1.5 text-[12px]">
                    {exportDetails.formatName && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-400 shrink-0">Formato</span>
                        <span className="text-white font-semibold truncate">{exportDetails.formatName}</span>
                      </div>
                    )}
                    {exportDetails.dimensions && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-400 shrink-0">Tamaño</span>
                        <span className="text-white/90 font-mono text-[11.5px]">{exportDetails.dimensions}</span>
                      </div>
                    )}
                    {exportDetails.fileType && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-400 shrink-0">Archivo</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/[0.15] border border-purple-500/[0.25] text-purple-200 font-bold text-[10px] tracking-wider">
                          {exportDetails.fileType.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {exportDetails.formatSubtitle && (
                    <p className="text-[10.5px] text-gray-500 mt-2 leading-tight">{exportDetails.formatSubtitle}</p>
                  )}
                </div>
              )}

              {/* Balance before → after */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                  <span>Coste</span>
                  <span className="font-bold text-purple-300">{amount} {amount === 1 ? "crédito" : "créditos"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-[9.5px] uppercase tracking-widest text-gray-500 font-bold mb-1">Antes</p>
                    <p className="text-[20px] font-black">{balance}</p>
                  </div>
                  <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <div className="flex-1 text-center">
                    <p className="text-[9.5px] uppercase tracking-widest text-gray-500 font-bold mb-1">Después</p>
                    <p className="text-[20px] font-black text-emerald-300">{afterBalance}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 font-bold text-[13px] hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[13px] shadow-lg shadow-purple-500/30 hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Procesando…" : "Confirmar →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
