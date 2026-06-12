"use client";

import Link from "next/link";
import { Sparkles, X, Check } from "lucide-react";

/**
 * Modal contextual "Sube a Pro" para puntos de fricción del editor.
 *
 * Se muestra cuando un user Free intenta usar feature Pro:
 * - Exportar PDF / SVG
 * - Quitar fondo IA (rate limit)
 * - Asistente IA (rate limit)
 * - Remix IA (rate limit)
 * - Subir fuente propia
 *
 * Personalizado por `feature` — mensaje específico de qué quería el user.
 *
 * Usa rgb absoluto para evitar dependencia de CSS vars (puede mostrarse
 * encima de cualquier ruta del editor).
 */

export type UpgradeFeature =
  | "pdf"
  | "svg"
  | "remove-bg"
  | "assistant"
  | "remix"
  | "fonts"
  | "watermark"
  | "ai-limit"
  | "generic";

const FEATURE_CONFIG: Record<UpgradeFeature, {
  icon: string;
  title: string;
  desc: string;
  highlight: string;
}> = {
  "pdf": {
    icon: "📄",
    title: "Exportar PDF para imprenta es Pro",
    desc: "Descarga tu flyer en PDF a tamaño real (mm) listo para llevar a imprenta. Calidad profesional sin pérdida.",
    highlight: "PDF imprenta",
  },
  "svg": {
    icon: "📐",
    title: "Exportar SVG vectorial es Pro",
    desc: "Descarga tu flyer como SVG editable en Illustrator, Figma o Inkscape. Sin perder calidad al escalar.",
    highlight: "SVG vectorial",
  },
  "remove-bg": {
    icon: "🪄",
    title: "Has llegado al límite de IA gratis",
    desc: "Pro te da IA ilimitada: quitar fondo, asistente, remix… sin contar y sin esperar.",
    highlight: "IA ilimitada",
  },
  "assistant": {
    icon: "✨",
    title: "El Asistente IA es para Pro",
    desc: "Describe tu evento en una frase y la IA rellena todos los campos automáticamente. Ahorra minutos cada flyer.",
    highlight: "Asistente IA ilimitado",
  },
  "remix": {
    icon: "🎨",
    title: "Generar Remix con IA es Pro",
    desc: "Cambia paleta + tipografía + efectos de tu flyer al instante. Genera variantes infinitas con IA.",
    highlight: "Remix IA ilimitado",
  },
  "fonts": {
    icon: "🔤",
    title: "Subir tus propias fuentes es Pro",
    desc: "Sube las fuentes de tu marca y úsalas en tus flyers. Mantén la identidad visual de tu empresa.",
    highlight: "Fuentes personalizadas",
  },
  "watermark": {
    icon: "🚫",
    title: "Descargar sin watermark es Pro",
    desc: "Pro elimina el sello “Hecho con ArteGenIA” de todas tus descargas. Tu marca, no la nuestra.",
    highlight: "Sin watermark",
  },
  "ai-limit": {
    icon: "⚡",
    title: "Has agotado tu IA diaria",
    desc: "El plan Free tiene 1 generación IA al día. Pro te da uso ilimitado del asistente, remix y quitar fondo.",
    highlight: "IA ilimitada",
  },
  "generic": {
    icon: "⭐",
    title: "Esta función es exclusiva de Pro",
    desc: "Desbloquea todo el potencial de ArteGenIA con el plan Pro.",
    highlight: "Todas las funciones Pro",
  },
};

export function UpgradeModal({
  feature,
  onClose,
}: {
  feature: UpgradeFeature;
  onClose: () => void;
}) {
  const cfg = FEATURE_CONFIG[feature];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[110] max-w-md mx-auto animate-in zoom-in-95 fade-in duration-300">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1c2a] to-[#13131f] border-2 border-purple-500/40 shadow-2xl shadow-purple-500/30">

          {/* Blobs decorativos */}
          <div aria-hidden className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-purple-600/30 blur-3xl pointer-events-none"/>
          <div aria-hidden className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-fuchsia-600/20 blur-3xl pointer-events-none"/>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition-colors"
          >
            <X size={16} strokeWidth={2.4} className="text-gray-400"/>
          </button>

          {/* Content */}
          <div className="relative p-6 pt-7">

            {/* Icon + badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center text-[28px]">
                {cfg.icon}
              </div>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest">
                ⭐ Pro
              </span>
            </div>

            {/* Title */}
            <h2 className="text-[20px] md:text-[22px] font-black text-white leading-tight mb-2">
              {cfg.title}
            </h2>

            {/* Description */}
            <p className="text-[13px] text-gray-300 leading-relaxed mb-5">
              {cfg.desc}
            </p>

            {/* Quick features list */}
            <div className="mb-6 p-4 rounded-2xl bg-black/30 border border-purple-500/20">
              <p className="text-[10px] uppercase tracking-widest text-purple-300 font-bold mb-2.5">
                Con Pro tienes
              </p>
              <ul className="space-y-2">
                {[
                  cfg.highlight,
                  "Sin watermark en descargas",
                  "PDF imprenta + SVG vectorial",
                  "Subir tus propias fuentes",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]">
                    <Check size={14} strokeWidth={3} className="shrink-0 mt-0.5 text-emerald-400"/>
                    <span className={i === 0 ? "text-white font-bold" : "text-gray-300"}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing teaser */}
            <div className="text-center mb-5">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-[36px] font-black bg-gradient-to-br from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  9,99€
                </span>
                <span className="text-[13px] text-gray-400">/mes</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cancela cuando quieras · Sin permanencia
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5">
              <Link
                href="/pricing"
                className="w-full text-center py-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[14px] active:scale-[0.97] transition-transform shadow-lg shadow-purple-500/40 flex items-center justify-center gap-2"
              >
                <Sparkles size={15} strokeWidth={2.5}/>
                Subir a Pro ahora →
              </Link>
              <button
                onClick={onClose}
                className="w-full text-center py-2.5 rounded-2xl text-gray-400 font-semibold text-[12px] hover:text-gray-200 transition-colors"
              >
                Tal vez después
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
