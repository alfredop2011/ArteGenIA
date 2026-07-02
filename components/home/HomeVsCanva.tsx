"use client";

/**
 * Sección "Por qué ArteGenIA y no Canva" — diferenciación competitiva.
 *
 * 6 puntos de comparación REALES (no marketing inflado):
 * - IA genera el flyer entero (Canva tiene Magic pero es text→image, no layout)
 * - Plantillas pensadas para nicho (DJ/baile/eventos) vs genéricas
 * - Español nativo + soporte humano
 * - Curva de aprendizaje cero
 * - Precio similar pero más generoso en free tier
 * - Capas mágicas (convierte imagen→plantilla editable)
 *
 * Diseño: tabla 2 cols (ArteGenIA destacada, Canva neutra). Mobile = stack.
 */

import Link from "next/link";
import { Sparkles, Check, X } from "lucide-react";

type ComparisonRow = {
  feature: string;
  artegenia: { label: string; included: boolean };
  canva: { label: string; included: boolean };
};

const ROWS: ComparisonRow[] = [
  {
    feature: "IA genera el flyer entero",
    artegenia: { label: "Layout + tipos + jerarquía hechos con IA en 1 click", included: true },
    canva: { label: "Magic Studio: text→imagen suelta, no flyer completo", included: false },
  },
  {
    feature: "Plantillas pensadas para tu nicho",
    artegenia: { label: "DJ, bachata, kizomba, salsa, hip-hop, workshops baile", included: true },
    canva: { label: "1M+ plantillas pero genéricas (bodas, business, fitness…)", included: false },
  },
  {
    feature: "Español nativo + soporte humano",
    artegenia: { label: "Hecho desde España. Soporte en castellano por persona real", included: true },
    canva: { label: "Traducido. Soporte por chatbot inglés con IA", included: false },
  },
  {
    feature: "Curva de aprendizaje",
    artegenia: { label: "Diseñado para quien NUNCA ha tocado Photoshop. 2 min al primer flyer", included: true },
    canva: { label: "Necesitas tutoriales para sacarle partido. Mil opciones avanzadas", included: false },
  },
  {
    feature: "Precio mensual Pro",
    artegenia: { label: "9,99€/mes — IA real incluida en free (10 usos/mes)", included: true },
    canva: { label: "11,99€/mes — Magic Studio capado en free a 1-2 usos", included: false },
  },
  {
    feature: "Capas Mágicas (foto → plantilla editable)",
    artegenia: { label: "Sube cualquier flyer y conviértelo en plantilla con textos editables", included: true },
    canva: { label: "No existe. Tienes que recrear desde cero", included: false },
  },
  {
    feature: "Calendario público de eventos incluido",
    artegenia: { label: "Diseñas el flyer Y lo publicas en /eventos. Tráfico orgánico real, sin coste extra", included: true },
    canva: { label: "Solo editor. Eventbrite es aparte y cobra comisión por venta", included: false },
  },
];

export default function HomeVsCanva() {
  return (
    <section className="mt-12 sm:mt-16">
      {/* Header */}
      <div className="text-center mb-8 max-w-3xl mx-auto px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
             style={{ background: "rgba(168,85,247,0.12)", boxShadow: "0 0 0 1px rgba(168,85,247,0.25)" }}>
          <Sparkles size={11} strokeWidth={2.5} className="text-purple-400" />
          <span className="text-[10.5px] font-bold uppercase tracking-widest text-purple-300">
            Por qué no Canva
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--home-text)" }}>
          La IA hace el flyer entero.{" "}
          <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
            No solo te ayuda a hacerlo.
          </span>
        </h2>
        <p className="text-sm sm:text-base" style={{ color: "var(--home-text-muted)" }}>
          Canva es un editor genérico potente. ArteGenIA es para ti si organizas eventos,
          das clases o necesitas un flyer YA — no en 30 minutos de toquetear capas.
        </p>
      </div>

      {/* Tabla comparativa */}
      <div className="max-w-5xl mx-auto">
        {/* Headers (solo desktop) */}
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr] gap-3 mb-3 px-2">
          <div></div>
          <div className="text-center px-4 py-3 rounded-xl"
               style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.18))",
                        boxShadow: "0 0 0 1px rgba(168,85,247,0.35)" }}>
            <p className="text-[11px] uppercase tracking-widest font-bold text-purple-200">ArteGenIA</p>
            <p className="text-[10px] text-purple-100/70 mt-0.5">Hecho para tu evento</p>
          </div>
          <div className="text-center px-4 py-3 rounded-xl"
               style={{ background: "rgba(255,255,255,0.03)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--home-text-soft)" }}>Canva</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--home-text-soft)" }}>Genérico para todo</p>
          </div>
        </div>

        <div className="space-y-3">
          {ROWS.map((row, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-3 items-stretch">
              {/* Feature label */}
              <div className="px-4 py-3 rounded-xl flex md:items-center"
                   style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04)" }}>
                <span className="text-[13px] sm:text-[14px] font-bold" style={{ color: "var(--home-text)" }}>
                  {row.feature}
                </span>
              </div>

              {/* ArteGenIA */}
              <div className="px-4 py-3 rounded-xl relative overflow-hidden"
                   style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.08))",
                            boxShadow: "0 0 0 1px rgba(168,85,247,0.25)" }}>
                <div className="md:hidden text-[9.5px] uppercase tracking-widest font-bold text-purple-300 mb-1">ArteGenIA</div>
                <div className="flex items-start gap-2">
                  <Check size={15} strokeWidth={3} className="shrink-0 mt-0.5 text-emerald-400" />
                  <span className="text-[12px] sm:text-[12.5px] leading-snug" style={{ color: "var(--home-text)" }}>
                    {row.artegenia.label}
                  </span>
                </div>
              </div>

              {/* Canva */}
              <div className="px-4 py-3 rounded-xl"
                   style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04)" }}>
                <div className="md:hidden text-[9.5px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--home-text-soft)" }}>Canva</div>
                <div className="flex items-start gap-2">
                  <X size={15} strokeWidth={2.5} className="shrink-0 mt-0.5 opacity-60" style={{ color: "var(--home-text-muted)" }} />
                  <span className="text-[12px] sm:text-[12.5px] leading-snug" style={{ color: "var(--home-text-muted)" }}>
                    {row.canva.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer honesto */}
        <p className="text-center text-[11px] mt-6 mb-6 max-w-2xl mx-auto opacity-60" style={{ color: "var(--home-text-muted)" }}>
          Canva es excelente si haces 50 cosas distintas (CVs, presentaciones, redes, packaging…).
          ArteGenIA es mejor si tu día a día son flyers de eventos/clases y quieres ahorrar tiempo.
        </p>

        {/* CTAs — probar + ver comparativa completa */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-black text-white transition-transform active:scale-95 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              boxShadow: "0 8px 24px rgba(168,85,247,0.4)",
            }}
          >
            <Sparkles size={14} strokeWidth={2.5} />
            Probar gratis — sin tarjeta →
          </Link>
          <Link
            href="/comparativa-canva"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              background: "var(--home-card-bg)",
              border: "1px solid var(--home-card-border)",
              color: "var(--home-text)",
            }}
          >
            Ver comparativa completa →
          </Link>
        </div>
      </div>
    </section>
  );
}
