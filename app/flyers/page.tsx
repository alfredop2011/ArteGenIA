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
  // Conteo de plantillas por categoría
  const countBySlug = Object.fromEntries(
    CATEGORY_SEO.map(c => [
      c.slug,
      templates.filter(t => c.rawNames.includes(t.category ?? "")).length,
    ]),
  );

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      <section className="px-5 py-10 md:py-16 max-w-5xl mx-auto">
        <nav aria-label="Breadcrumb" className="text-[11px] text-gray-500 mb-4">
          <Link href="/" className="hover:text-purple-300">Inicio</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-300">Flyers</span>
        </nav>

        <h1 className="text-[28px] md:text-[40px] font-black leading-tight mb-3">
          Flyers profesionales para cualquier evento
        </h1>
        <p className="text-[14px] md:text-[16px] text-gray-300 leading-relaxed max-w-3xl mb-8">
          Plantillas optimizadas por tipo de evento: conciertos, clases de baile, fiestas, festivales,
          discotecas, eventos corporativos y galas. Edita en el móvil, exporta en PNG/PDF/SVG y
          comparte en redes sociales gratis. Sin software de diseño.
        </p>

        {/* Grid de categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORY_SEO.map(cat => {
            const count = countBySlug[cat.slug] ?? 0;
            return (
              <Link
                key={cat.slug}
                href={`/flyers/${cat.slug}`}
                className="group block rounded-2xl bg-[#13131f] border border-white/[0.06] p-5 active:scale-[0.98] transition-transform hover:border-purple-500/40"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[36px] leading-none">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-black leading-tight mb-1">
                      {cat.h1}
                    </h2>
                    <p className="text-[11px] text-gray-500 mb-2">
                      {count} plantilla{count === 1 ? "" : "s"}
                    </p>
                    <p className="text-[12px] text-gray-300 leading-snug line-clamp-3">
                      {cat.intro}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-[11px] text-purple-300 font-bold">
                      Ver plantillas →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-purple-500/15 to-fuchsia-500/15 border border-purple-500/30 text-center">
          <h2 className="text-[18px] md:text-[22px] font-black mb-2">
            ¿No sabes cuál elegir?
          </h2>
          <p className="text-[12px] text-gray-300 leading-relaxed mb-4 max-w-md mx-auto">
            Empieza con el editor y prueba el Asistente IA: describes tu evento en una frase y la IA
            rellena el flyer automáticamente.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[14px] active:scale-[0.97] shadow-lg shadow-purple-500/30"
          >
            Ver todas las plantillas →
          </Link>
        </div>
      </section>
    </main>
  );
}
