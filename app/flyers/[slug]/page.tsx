import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { templates } from "@/data/templates";
import { getCategorySEO, getAllCategorySlugs, CATEGORY_SEO } from "@/data/categorySEO";

export const dynamic = "force-static";
export const revalidate = 86400; // re-revalida cada 24h

/**
 * /flyers/[slug] — Landing SEO por categoría.
 *
 * Páginas estáticas pre-renderizadas para los 7 slugs (conciertos,
 * clases-de-baile, fiestas, festivales, discotecas, corporativos, galas).
 *
 * Cada página tiene:
 * - <title> + <meta description> + OG + Twitter + canonical
 * - H1 + intro larga (300-500 chars optimizado SEO)
 * - Grid de plantillas reales del catálogo filtradas
 * - JSON-LD FAQPage schema para rich snippets en Google
 * - CTA final → /editor/<templateId> o /templates
 *
 * Estrategia: tráfico orgánico long-tail "flyer para clases de baile",
 * "flyer concierto gratis", "plantilla flyer fiesta", etc.
 */

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.vercel.app";

export function generateStaticParams() {
  return getAllCategorySlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategorySEO(slug);
  if (!cat) {
    return {
      title: "Categoría no encontrada · ArteGenIA",
      robots: { index: false },
    };
  }
  const pageUrl = `${SITE_URL}/flyers/${slug}`;
  return {
    title: cat.metaTitle,
    description: cat.metaDescription,
    keywords: cat.keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: cat.metaTitle,
      description: cat.metaDescription,
      url: pageUrl,
      siteName: "ArteGenIA",
      locale: "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cat.metaTitle,
      description: cat.metaDescription,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = getCategorySEO(slug);
  if (!cat) notFound();

  // Filtrar plantillas que coincidan con cualquiera de los rawNames
  const matches = templates.filter(t => cat.rawNames.includes(t.category ?? ""));

  // Generar JSON-LD para FAQPage schema (rich snippets)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cat.faq.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Flyers", item: `${SITE_URL}/flyers` },
      { "@type": "ListItem", position: 3, name: cat.h1, item: `${SITE_URL}/flyers/${slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* HERO */}
      <section className="px-5 py-10 md:py-16 max-w-5xl mx-auto">
        {/* Breadcrumbs visuales */}
        <nav aria-label="Breadcrumb" className="text-[11px] text-gray-500 mb-4">
          <Link href="/" className="hover:text-purple-300">Inicio</Link>
          <span className="mx-1.5">›</span>
          <Link href="/flyers" className="hover:text-purple-300">Flyers</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-300">{cat.h1}</span>
        </nav>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[40px] leading-none">{cat.emoji}</span>
          <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
            Plantillas
          </span>
        </div>
        <h1 className="text-[28px] md:text-[40px] font-black leading-tight mb-3">
          {cat.h1}
        </h1>
        <p className="text-[14px] md:text-[16px] text-gray-300 leading-relaxed max-w-3xl mb-6">
          {cat.intro}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/templates"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[13px] active:scale-[0.97] shadow-lg shadow-purple-500/30"
          >
            Ver todas las plantillas →
          </Link>
          {matches[0] && (
            <Link
              href={`/editor/${matches[0].id}`}
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-gray-200 font-bold text-[13px] active:bg-white/10"
            >
              Empezar a editar gratis
            </Link>
          )}
        </div>
      </section>

      {/* GRID DE PLANTILLAS */}
      <section className="px-5 py-6 max-w-5xl mx-auto">
        <h2 className="text-[18px] md:text-[22px] font-black mb-4">
          {matches.length} plantilla{matches.length === 1 ? "" : "s"} para {cat.h1.toLowerCase()}
        </h2>
        {matches.length === 0 ? (
          <p className="text-[13px] text-gray-400">
            Aún no tenemos plantillas en esta categoría. <Link href="/templates" className="text-purple-300 underline">Ver todas</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {matches.map(tpl => (
              <Link
                key={tpl.id}
                href={`/editor/${tpl.id}`}
                className="group block rounded-2xl overflow-hidden bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
              >
                <div className="aspect-[4/5] relative bg-[#0a0a14] overflow-hidden">
                  {tpl.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={tpl.image}
                      alt={`Plantilla flyer ${tpl.title} para ${cat.h1.toLowerCase()}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-[40px]">
                      {cat.emoji}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[12px] font-bold truncate">{tpl.title}</div>
                  <div className="text-[10px] text-gray-500">
                    {tpl.variants.length} formato{tpl.variants.length === 1 ? "" : "s"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="px-5 py-10 max-w-3xl mx-auto border-t border-white/[0.06] mt-10">
        <h2 className="text-[20px] md:text-[24px] font-black mb-5">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col gap-3">
          {cat.faq.map((f, i) => (
            <details
              key={i}
              className="rounded-xl bg-[#13131f] border border-white/[0.06] px-4 py-3"
            >
              <summary className="text-[13px] font-bold cursor-pointer leading-snug">
                {f.q}
              </summary>
              <p className="text-[12px] text-gray-300 leading-relaxed mt-2">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 py-12 max-w-3xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/15 to-fuchsia-500/15 border border-purple-500/30">
          <h2 className="text-[20px] md:text-[24px] font-black mb-2">
            Crea tu flyer en 2 minutos
          </h2>
          <p className="text-[13px] text-gray-300 leading-relaxed mb-4 max-w-md mx-auto">
            Sin software de diseño. Plantillas profesionales, IA que rellena el contenido,
            descarga PNG/PDF/SVG y comparte directo en WhatsApp.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[14px] active:scale-[0.97] shadow-lg shadow-purple-500/30"
          >
            Empezar gratis →
          </Link>
          <p className="text-[10px] text-gray-500 mt-3">
            Sin tarjeta de crédito · 4 idiomas · Funciona en móvil
          </p>
        </div>
      </section>

      {/* OTRAS CATEGORÍAS — internal linking */}
      <section className="px-5 py-10 max-w-5xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-[16px] font-black mb-4 text-gray-300">
          Otras categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORY_SEO.filter(c => c.slug !== slug).map(c => (
            <Link
              key={c.slug}
              href={`/flyers/${c.slug}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#13131f] border border-white/[0.06] active:bg-white/[0.05] transition-colors"
            >
              <span className="text-[18px]">{c.emoji}</span>
              <span className="text-[12px] font-bold leading-tight truncate">
                {c.h1.split(" ").slice(2).join(" ").replace(" en minutos", "").replace(" profesionales", "")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
