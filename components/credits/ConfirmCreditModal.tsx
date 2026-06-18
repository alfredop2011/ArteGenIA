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
import { shouldWatermark } from "@/lib/applyWatermark";

// UX#19 — clave localStorage para recordar "no preguntar más hoy".
// Almacena un timestamp ms. Si Date.now() < valor, el modal se autoconfirma
// sin mostrar UI. Se resetea cada 24h para evitar que el user gaste sin querer
// si baja del plan o cambia precios.
const SKIP_KEY = "creditConfirm_skipUntil";
const SKIP_TTL_MS = 24 * 60 * 60 * 1000;

function readSkipUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(SKIP_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch { return 0; }
}

function writeSkipFor24h() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SKIP_KEY, String(Date.now() + SKIP_TTL_MS));
  } catch { /* ignore quota errors */ }
}

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
  /** UX#21 follow-up — plan del user. Si está presente Y shouldWatermark(plan)
   *  es true, mostramos warning visible 'Esta descarga llevará marca de agua'
   *  antes de confirmar. Hoy WATERMARK_ENABLED=false → nunca se muestra.
   *  Precautorio: si en el futuro re-activan el watermark, el aviso ya está
   *  conectado y los users free no se sorprenden con la marca tras descargar. */
  plan?: string | null;
};

export function ConfirmCreditModal({
  open, onClose, onConfirm, actionLabel, amount, balance, daysUntilReset, exportDetails, plan,
}: ConfirmCreditModalProps) {
  const [loading, setLoading] = useState(false);
  const [skipNext, setSkipNext] = useState(false);
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

  // UX#19 — Auto-confirm si el user marcó "no preguntar más hoy" dentro de las
  // últimas 24h. Solo se aplica si tiene créditos suficientes (los estados
  // exhausted/upgrade siempre se muestran porque requieren decisión activa).
  useEffect(() => {
    if (!open || insufficient) return;
    if (readSkipUntil() <= Date.now()) return;
    // Auto-confirmar silenciosamente
    void (async () => {
      try { await onConfirm(); } finally { onClose(); }
    })();
    // Solo en mount/cambio de open. onConfirm/onClose son estables del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, insufficient]);

  if (!open) return null;
  // Si auto-skip activo, no renderizar nada — el useEffect se encarga.
  if (!insufficient && readSkipUntil() > Date.now()) return null;

  const afterBalance = balance - amount;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (skipNext) writeSkipFor24h();
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

              {/* UX#21 follow-up — Warning watermark (precautorio).
                  Hoy WATERMARK_ENABLED=false → shouldWatermark() siempre
                  retorna false → este bloque no se renderiza nunca. Si
                  en el futuro re-activan el watermark, el aviso aparece
                  automáticamente para users free SOLO en exports. */}
              {exportDetails && shouldWatermark(plan) && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5"
                     style={{ background: "rgba(251,191,36,0.10)", boxShadow: "0 0 0 1px rgba(251,191,36,0.30)" }}>
                  <span className="text-[16px] leading-none mt-[1px]" aria-hidden>⚠️</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-amber-200 mb-0.5">
                      Esta descarga llevará marca de agua
                    </p>
                    <p className="text-[11px] text-amber-100/80 leading-snug">
                      Sello &ldquo;Hecho con ArteGenIA&rdquo; en una esquina.{" "}
                      <Link href="/pricing"
                            onClick={() => trackUpgradeClicked({
                              source: "feature_gate",
                              current_plan: (plan === "pro" || plan === "enterprise" || plan === "anonymous" ? plan : "free"),
                              current_balance: balance,
                            })}
                            className="font-bold underline underline-offset-2 hover:text-amber-50">
                        Quítala con Pro →
                      </Link>
                    </p>
                  </div>
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

              {/* UX#19 — Checkbox 'no volver a preguntar hoy' (24h en localStorage) */}
              <label className="flex items-center gap-2 mb-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={skipNext}
                  onChange={(e) => setSkipNext(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/40 cursor-pointer accent-purple-500"
                />
                <span className="text-[11.5px] text-gray-400 group-hover:text-gray-300">
                  No volver a preguntar hoy
                </span>
              </label>

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
