import type { Metadata } from "next";
import Link from "next/link";
import { templates } from "@/data/templates";
import { CATEGORY_SEO } from "@/data/categorySEO";

export const dynamic = "force-static";
export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.vercel.app";

export const metadata: Metadata = {
  title: "Flyers para eventos · Plantillas gratis · ArteGenIA",
  description: "Plantillas de flyers profesionales para conciertos, clases de baile, fiestas, festivales, discotecas, eventos corporativos y galas. Edita en el móvil y descarga gratis.",
  alternates: { canonical: `${SITE_URL}/flyers` },
  openGraph: {
    title: "Flyers para eventos · 7 categorías · ArteGenIA",
    description: "Plantillas profesionales para todo tipo de eventos. Gratis y editable en el móvil.",
    url: `${SITE_URL}/flyers`,
    siteName: "ArteGenIA",
    locale: "es_ES",
    type: "website",
  },
};

export default function FlyersIndexPage() {
  const countBySlug = Object.fromEntries(
    CATEGORY_SEO.map(c => [
      c.slug,
      templates.filter(t => c.rawNames.includes(t.category ?? "")).length,
    ]),
  );
  const total = templates.length;

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Blobs animados */}
        <div aria-hidden className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-3xl animate-blob"/>
        <div aria-hidden className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-3xl animate-blob animate-blob-delay-2"/>

        <div className="relative px-5 py-16 md:py-24 max-w-5xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="text-[11px] text-gray-500 mb-6 animate-fade-up">
            <Link href="/" className="hover:text-purple-300 transition-colors">Inicio</Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-300">Flyers</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6 animate-fade-up-delay-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[11px] uppercase tracking-widest text-purple-300 font-bold">
              {total} plantillas en {CATEGORY_SEO.length} categorías
            </span>
          </div>

          <h1 className="text-[32px] md:text-[52px] lg:text-[64px] font-black leading-[1.05] mb-4 animate-fade-up-delay-2">
            Flyers profesionales<br/>
            <span className="shimmer-text">para cualquier evento</span>
          </h1>
          <p className="text-[14px] md:text-[18px] text-gray-300 leading-relaxed max-w-2xl mx-auto mb-8 animate-fade-up-delay-3">
            Plantillas optimizadas por tipo de evento. Edita en el móvil, exporta en PNG/PDF/SVG y comparte en redes sociales gratis. Sin software de diseño.
          </p>

          <div className="flex flex-wrap gap-3 justify-center animate-fade-up-delay-4">
            <Link
              href="/templates"
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[14px] active:scale-[0.97] transition-transform shadow-2xl shadow-purple-500/40 animate-pulse-glow"
            >
              Empezar gratis →
            </Link>
            <Link
              href="/editor/44?format=portrait"
              className="px-7 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[14px] hover:bg-white/[0.10] hover:border-purple-500/30 transition-all"
            >
              Probar el editor
            </Link>
          </div>
        </div>
      </section>

      {/* GRID DE CATEGORÍAS — cards grandes con hover */}
      <section className="px-5 pb-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_SEO.map((cat) => {
            const count = countBySlug[cat.slug] ?? 0;
            return (
              <Link
                key={cat.slug}
                href={`/flyers/${cat.slug}`}
                className="group relative block rounded-3xl overflow-hidden bg-gradient-to-br from-[#13131f] to-[#1c1c2a] border border-white/[0.06] p-6 card-lift"
              >
                {/* Decorative gradient blob top-right */}
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ background: `radial-gradient(circle, ${["#a855f7", "#ec4899", "#facc15", "#22d3ee", "#22c55e", "#fb923c", "#3b82f6"][CATEGORY_SEO.indexOf(cat) % 7]}, transparent)` }}
                />
                <div className="relative">
                  <span className="text-[44px] leading-none inline-block group-hover:scale-110 transition-transform mb-3">
                    {cat.emoji}
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      {count} plantilla{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h2 className="text-[18px] md:text-[20px] font-black leading-tight mb-2">
                    {cat.h1}
                  </h2>
                  <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-3 mb-4">
                    {cat.intro}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-purple-300 font-bold group-hover:gap-3 transition-all">
                    Ver plantillas
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 pb-20 max-w-4xl mx-auto">
        <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 bg-gradient-animated text-center">
          <div aria-hidden className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-blob"/>
          <div aria-hidden className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-blob animate-blob-delay-2"/>

          <div className="relative">
            <h2 className="text-[24px] md:text-[36px] font-black mb-3 leading-tight">
              ¿No sabes cuál elegir?
            </h2>
            <p className="text-[14px] text-white/90 leading-relaxed mb-6 max-w-md mx-auto">
              Empieza con el editor y prueba el <strong>Asistente IA</strong>: describes tu evento en una frase y la IA rellena el flyer automáticamente.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-purple-600 font-black text-[15px] active:scale-[0.97] transition-transform shadow-2xl shadow-black/30 animate-pulse-glow"
            >
              Ver todas las plantillas →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-black shadow-md shadow-purple-500/30">
              AG
            </div>
            <span className="font-black text-[14px]">ArteGenIA</span>
          </Link>
          <p className="text-[11px] text-gray-500">
            © ArteGenIA · Plantillas de flyers gratis · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
