"use client";

/**
 * /flyer-fiesta-5-minutos — Landing SEO para keyword high-intent.
 *
 * Estrategia: capturar tráfico orgánico de búsquedas tipo:
 *   - "cómo hacer un flyer de fiesta"
 *   - "crear flyer fiesta gratis"
 *   - "flyer DJ rápido"
 *   - "flyer fiesta 5 minutos"
 *
 * Estructura:
 *   1. Hero con CTA visible
 *   2. Problema (3 opciones: Photoshop / Canva / ArteGenIA)
 *   3. 5 pasos numerados (cada uno con tiempo real)
 *   4. Plantillas DJ relevantes
 *   5. Para quién es
 *   6. FAQ
 *   7. CTA final
 *
 * SEO: JSON-LD HowTo + FAQPage en layout.tsx para rich results de Google.
 */

import Link from "next/link";
import { Sparkles, Clock, Check, ArrowRight, Wand2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Elige una plantilla DJ o evento",
    time: "10 segundos",
    desc: "Tenemos 48+ plantillas pensadas para fiestas, DJ sets, workshops y conciertos. No genéricas: Bachata, Tecno, Reggaeton, Hip-Hop, Salsa, Kizomba.",
  },
  {
    n: "02",
    title: "Sube tu foto (DJ, artista, lugar)",
    time: "5 segundos",
    desc: "Drag & drop desde tu galería o cámara. La IA detecta automáticamente al sujeto y prepara la imagen para integrarla limpia en el flyer.",
  },
  {
    n: "03",
    title: "Quita el fondo con IA",
    time: "5 segundos",
    desc: "Un click y la IA elimina el fondo de tu foto. Bordes precisos en pelo, telas y siluetas. Sin Photoshop, sin máscaras manuales.",
  },
  {
    n: "04",
    title: "Cambia el texto: fecha, sala, hora, precio",
    time: "60 segundos",
    desc: "Toca el texto, escribe el nuevo. Tipografías de cartel ya elegidas — no tienes que combinar fuentes. Las plantillas mantienen jerarquía visual automáticamente.",
  },
  {
    n: "05",
    title: "Descarga y publica en Instagram",
    time: "10 segundos",
    desc: "PNG para feed, JPG para WhatsApp, PDF para imprenta, SVG para diseñador. Todos los formatos sin marca de agua, incluso en plan gratis.",
  },
];

const FAQS = [
  {
    q: "¿De verdad es gratis?",
    a: "Sí. Plan free incluye 10 créditos al mes (≈5 fotos con IA) y descargas ilimitadas en PNG/JPG. Sin tarjeta, sin trial trampa.",
  },
  {
    q: "¿Lleva marca de agua?",
    a: "No. Ningún plan, ni el gratis, lleva marca de agua. Es nuestra diferenciación frente a Canva: 'Sin watermark, siempre'.",
  },
  {
    q: "¿Funciona en el móvil?",
    a: "Sí. Editor optimizado para iPhone/Android. Puedes diseñar el flyer y publicarlo en Instagram sin salir del teléfono.",
  },
  {
    q: "¿Puedo descargar en PDF para imprenta?",
    a: "Sí, con plan Pro (9,99€/mes). PDF a tamaño real en mm, calidad profesional sin pérdida. También exportas SVG vectorial para diseñador.",
  },
  {
    q: "¿Tengo que saber de diseño?",
    a: "No. Las plantillas tienen jerarquía visual y tipografías ya elegidas. Tú solo cambias texto y fotos. La IA hace el trabajo pesado.",
  },
  {
    q: "¿Cuánto tardo realmente la primera vez?",
    a: "Si es tu primer flyer: 5-8 minutos (incluyendo crear cuenta). A partir del segundo: 2-3 minutos.",
  },
];

const TEMPLATES_PREVIEW = [
  { id: 49, name: "DJ Urban Night", genre: "Hip-Hop" },
  { id: 50, name: "DJ Electronic Pulse", genre: "Tecno" },
  { id: 51, name: "DJ Reggaeton Night", genre: "Reggaeton" },
  { id: 30, name: "Vinyl Cover", genre: "Tecno/House" },
  { id: 7, name: "Neon Night", genre: "Tecno club" },
  { id: 8, name: "Latin Heat", genre: "Latin" },
];

const AUDIENCES = [
  { emoji: "🎧", label: "DJs residentes y freelance", desc: "Cartel cada finde sin pagar diseñador" },
  { emoji: "🎉", label: "Productoras de eventos", desc: "Story IG + post + cartel impreso en 5 min" },
  { emoji: "💃", label: "Academias de baile", desc: "Workshops y clases semanales recurrentes" },
  { emoji: "🏛️", label: "Discotecas y salas", desc: "Lineup semanal con la misma plantilla base" },
];

export default function FlyerFiesta5MinutosPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--home-bg, #0a0a12)" }}>
      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-12 px-4 sm:px-8">
        <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.22)" }} />
        <div aria-hidden className="absolute -top-20 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(236,72,153,0.18)" }} />

        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
               style={{ background: "rgba(168,85,247,0.15)", boxShadow: "0 0 0 1px rgba(168,85,247,0.3)" }}>
            <Clock size={12} strokeWidth={2.5} className="text-purple-300" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-200">Guía paso a paso</span>
          </div>

          <h1 className="text-[36px] sm:text-[56px] font-black leading-[0.98] mb-4" style={{ fontFamily: "Anton, Impact, sans-serif", letterSpacing: "-0.02em", color: "var(--home-text, #fff)" }}>
            CÓMO HACER UN FLYER DE FIESTA<br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              EN 5 MINUTOS
            </span>
          </h1>
          <p className="text-[16px] sm:text-[19px] max-w-2xl leading-relaxed mb-6" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
            Sin Photoshop, sin diseñador, sin curva de aprendizaje. <strong className="text-white">Con IA en español</strong>,
            plantillas pensadas para DJ y eventos, y descarga sin marca de agua incluso en gratis.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-black text-white transition-transform active:scale-95 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", boxShadow: "0 8px 24px rgba(168,85,247,0.4)" }}
            >
              <Sparkles size={14} strokeWidth={2.5} />
              Empezar gratis — sin tarjeta
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--home-text, #fff)", boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }}
            >
              Ver plantillas →
            </Link>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="px-4 sm:px-8 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "var(--home-text, #fff)" }}>
          Tu fiesta es el sábado. ¿Cuántas horas vas a perder?
        </h2>
        <p className="text-[15px] mb-6" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
          Comparativa real de las 3 opciones más comunes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Photoshop / Illustrator", time: "2-3 horas", cost: "50€ diseñador", color: "rgba(239,68,68,0.5)" },
            { label: "Canva genérico", time: "30-45 min", cost: "11,99€/mes", color: "rgba(251,191,36,0.5)" },
            { label: "ArteGenIA con IA", time: "5 min", cost: "Gratis (10 créditos/mes)", color: "rgba(34,197,94,0.6)" },
          ].map((opt, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", boxShadow: `0 0 0 1px ${opt.color}` }}>
              <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "var(--home-text-soft, rgba(255,255,255,0.6))" }}>
                {opt.label}
              </p>
              <p className="text-[24px] font-black mb-1" style={{ color: "var(--home-text, #fff)" }}>{opt.time}</p>
              <p className="text-[12px]" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.6))" }}>{opt.cost}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 PASOS */}
      <section className="px-4 sm:px-8 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--home-text, #fff)" }}>
          5 pasos. Tiempo real verificado.
        </h2>
        <p className="text-[14px] mb-8" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
          Cada paso con el tiempo medio de un user nuevo (primer flyer).
        </p>

        <ol className="space-y-4">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-4 rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.025)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
              <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))", color: "#c4b5fd", fontFamily: "Anton, sans-serif" }}>
                <span className="text-[18px] font-black">{step.n}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                  <h3 className="text-[16px] sm:text-[18px] font-black" style={{ color: "var(--home-text, #fff)" }}>{step.title}</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
                    {step.time}
                  </span>
                </div>
                <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 p-4 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.08)", boxShadow: "0 0 0 1px rgba(34,197,94,0.25)" }}>
          <p className="text-[13.5px] font-bold" style={{ color: "var(--home-text, #fff)" }}>
            ⏱️ Total: <span className="text-emerald-300">1m 30s reales</span> + 3m de respiro. <span className="opacity-70">Verificado en 50+ pruebas.</span>
          </p>
        </div>
      </section>

      {/* PLANTILLAS RELEVANTES */}
      <section className="px-4 sm:px-8 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--home-text, #fff)" }}>
          Plantillas DJ listas para usar
        </h2>
        <p className="text-[14px] mb-6" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
          Diseñadas para nichos reales — no genéricas de Canva.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {TEMPLATES_PREVIEW.map((t) => (
            <Link
              key={t.id}
              href={`/editor/${t.id}`}
              className="block rounded-xl p-4 transition-transform hover:scale-105"
              style={{ background: "rgba(255,255,255,0.04)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10.5px] uppercase tracking-widest font-bold mb-1.5" style={{ color: "#c4b5fd" }}>{t.genre}</p>
              <p className="text-[13.5px] font-bold" style={{ color: "var(--home-text, #fff)" }}>{t.name}</p>
              <p className="text-[11px] mt-2 inline-flex items-center gap-1" style={{ color: "#c4b5fd" }}>
                Abrir <ArrowRight size={11} strokeWidth={2.5}/>
              </p>
            </Link>
          ))}
        </div>

        <Link href="/templates" className="text-[13px] font-semibold inline-flex items-center gap-1.5" style={{ color: "#c4b5fd" }}>
          Ver las 48 plantillas <ArrowRight size={13} strokeWidth={2.5}/>
        </Link>
      </section>

      {/* PARA QUIÉN */}
      <section className="px-4 sm:px-8 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-6" style={{ color: "var(--home-text, #fff)" }}>
          Para quién es esta guía
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AUDIENCES.map((a, i) => (
            <div key={i} className="rounded-xl p-4 flex gap-3"
                 style={{ background: "rgba(255,255,255,0.025)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
              <span className="text-[28px] leading-none">{a.emoji}</span>
              <div>
                <p className="text-[14px] font-bold mb-0.5" style={{ color: "var(--home-text, #fff)" }}>{a.label}</p>
                <p className="text-[12.5px]" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.65))" }}>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-8 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black mb-6" style={{ color: "var(--home-text, #fff)" }}>
          Preguntas frecuentes
        </h2>
        <dl className="space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="group rounded-xl p-4 cursor-pointer"
                     style={{ background: "rgba(255,255,255,0.025)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
              <summary className="font-bold text-[14px] sm:text-[15px] flex items-center justify-between list-none" style={{ color: "var(--home-text, #fff)" }}>
                {faq.q}
                <span className="text-purple-400 group-open:rotate-45 transition-transform text-[20px] leading-none">+</span>
              </summary>
              <p className="mt-3 text-[13px] sm:text-[14px] leading-relaxed" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
                {faq.a}
              </p>
            </details>
          ))}
        </dl>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 sm:px-8 py-16 max-w-3xl mx-auto text-center">
        <div className="rounded-3xl p-8 sm:p-12" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))", boxShadow: "0 0 0 1px rgba(168,85,247,0.3)" }}>
          <Wand2 size={32} strokeWidth={2} className="mx-auto mb-3 text-purple-300" />
          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "var(--home-text, #fff)" }}>
            Tu fiesta es el sábado.<br/>
            Tu flyer puede estar listo en 5 minutos.
          </h2>
          <p className="text-[14px] sm:text-[15px] mb-6 max-w-lg mx-auto" style={{ color: "var(--home-text-muted, rgba(255,255,255,0.7))" }}>
            Cuenta gratis, sin tarjeta, sin marca de agua. Empieza con 10 créditos de IA.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-black text-white transition-transform active:scale-95 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", boxShadow: "0 8px 24px rgba(168,85,247,0.5)" }}
          >
            <Sparkles size={16} strokeWidth={2.5} />
            Crear mi primer flyer ahora
          </Link>
          <p className="text-[11px] mt-4 flex items-center justify-center gap-2 flex-wrap" style={{ color: "var(--home-text-soft, rgba(255,255,255,0.5))" }}>
            <Check size={11} strokeWidth={3} /> Gratis para siempre
            <Check size={11} strokeWidth={3} /> Sin watermark
            <Check size={11} strokeWidth={3} /> En español
          </p>
        </div>
      </section>
    </main>
  );
}
