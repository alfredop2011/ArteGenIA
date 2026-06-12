import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { templates } from "@/data/templates";
import { getCategorySEO, getAllCategorySlugs, CATEGORY_SEO } from "@/data/categorySEO";

export const dynamic = "force-static";
export const revalidate = 86400;

/**
 * /flyers/[slug] — Landing SEO por categoría (renovado con diseño pro).
 *
 * Layout en 7 secciones para enganchar al visitante:
 * 1. HERO: Gradient animado + mockup flotante + counter shimmer + CTAs primarios
 * 2. STATS: Trust badges con números (animados fade-up)
 * 3. CÓMO FUNCIONA: 3 steps con iconos morados grandes
 * 4. GRID DE PLANTILLAS: Cards con hover lift + glow
 * 5. DEMO DEL EDITOR: Captura grande con annotations de features
 * 6. FAQ con animación smooth expand
 * 7. CTA FINAL con pulse-glow
 * 8. OTRAS CATEGORÍAS (internal linking con hover effects)
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
    return { title: "Categoría no encontrada · ArteGenIA", robots: { index: false } };
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

  const matches = templates.filter(t => cat.rawNames.includes(t.category ?? ""));
  const firstTemplate = matches[0];

  // Featured: las 3 primeras como hero showcase
  const featured = matches.slice(0, 3);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cat.faq.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
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
    <main className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}/>

      {/* ═══ 1. HERO ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-20">
        {/* Blobs decorativos animados detrás */}
        <div aria-hidden className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-3xl animate-blob"/>
        <div aria-hidden className="absolute top-32 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-3xl animate-blob animate-blob-delay-2"/>
        <div aria-hidden className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-pink-600/10 blur-3xl animate-blob animate-blob-delay-4"/>

        <div className="relative px-5 pt-8 pb-12 md:pt-16 md:pb-20 max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-[11px] text-gray-500 mb-6 animate-fade-up">
            <Link href="/" className="hover:text-purple-300 transition-colors">Inicio</Link>
            <span className="mx-1.5">›</span>
            <Link href="/flyers" className="hover:text-purple-300 transition-colors">Flyers</Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-300">{cat.h1.split(" ").slice(0, 3).join(" ")}…</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Lado izquierdo: texto + CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-5 animate-fade-up">
                <span className="text-[18px]">{cat.emoji}</span>
                <span className="text-[10px] uppercase tracking-widest text-purple-300 font-bold">
                  {matches.length} plantillas profesionales
                </span>
              </div>

              <h1 className="text-[32px] md:text-[44px] lg:text-[52px] font-black leading-[1.05] mb-4 animate-fade-up-delay-1">
                {cat.h1.split(" ").slice(0, -3).join(" ")}{" "}
                <span className="shimmer-text">
                  {cat.h1.split(" ").slice(-3).join(" ")}
                </span>
              </h1>

              <p className="text-[14px] md:text-[16px] text-gray-300 leading-relaxed mb-6 max-w-xl animate-fade-up-delay-2">
                {cat.intro}
              </p>

              {/* Trust badges con counters */}
              <div className="flex flex-wrap gap-2 mb-6 animate-fade-up-delay-3">
                <Badge icon="🆓" text="Gratis"/>
                <Badge icon="⚡" text="2 minutos"/>
                <Badge icon="🚫💳" text="Sin tarjeta"/>
                <Badge icon="🌍" text="4 idiomas"/>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 animate-fade-up-delay-4">
                {firstTemplate && (
                  <Link
                    href={`/editor/${firstTemplate.id}`}
                    className="group relative px-7 py-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[14px] active:scale-[0.97] transition-transform shadow-2xl shadow-purple-500/40 animate-pulse-glow"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Empezar gratis ahora →
                    </span>
                  </Link>
                )}
                <Link
                  href="/templates"
                  className="px-7 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[14px] hover:bg-white/[0.10] hover:border-purple-500/30 transition-all"
                >
                  Ver todas las plantillas
                </Link>
              </div>

              {/* Social proof microscópico */}
              <div className="flex items-center gap-3 mt-6 animate-fade-up-delay-4">
                <div className="flex -space-x-2">
                  {["#a855f7", "#ec4899", "#facc15", "#22d3ee"].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-[#0a0a14] flex items-center justify-center text-[10px] font-black"
                      style={{ background: c }}
                    >
                      {["A", "M", "L", "J"][i]}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 leading-tight">
                  <span className="text-white font-bold">+150 organizadores</span>
                  <br/>
                  ya crean sus flyers aquí
                </p>
              </div>
            </div>

            {/* Lado derecho: showcase de 3 plantillas en mockup */}
            <div className="relative">
              <div className="relative grid grid-cols-3 gap-3 animate-fade-up-delay-2">
                {featured.map((tpl, i) => (
                  <div
                    key={tpl.id}
                    className={`rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-purple-500/20 bg-[#13131f] ${
                      i === 1 ? "animate-float scale-110 z-10" : "animate-float"
                    }`}
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden">
                      {tpl.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={tpl.image}
                          alt={tpl.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Decorative gradient blob debajo */}
              <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-tr from-purple-500/20 via-fuchsia-500/10 to-pink-500/20 blur-3xl"/>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. STATS / FEATURES BAR ════════════════════════════════════ */}
      <section className="border-y border-white/[0.06] bg-gradient-to-r from-purple-500/[0.03] via-fuchsia-500/[0.03] to-pink-500/[0.03]">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat number={matches.length.toString()} label="Plantillas profesionales"/>
          <Stat number="4" label="Formatos por plantilla"/>
          <Stat number="2 min" label="Edición promedio"/>
          <Stat number="0€" label="Coste sin watermark"/>
        </div>
      </section>

      {/* ═══ 3. CÓMO FUNCIONA ══════════════════════════════════════════ */}
      <section className="px-5 py-16 md:py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
            Sin software de diseño
          </p>
          <h2 className="text-[28px] md:text-[36px] font-black leading-tight">
            Crea tu flyer en 3 pasos
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "1", emoji: "🎨", title: "Elige plantilla", desc: "Selecciona entre nuestras plantillas profesionales pensadas para tu tipo de evento." },
            { step: "2", emoji: "✍️", title: "Edita con IA", desc: "Cambia textos, sube fotos, cambia colores. La IA puede rellenar todo desde una descripción." },
            { step: "3", emoji: "🚀", title: "Descarga y comparte", desc: "Exporta en PNG, JPG, PDF imprenta o SVG vectorial. Comparte directo en WhatsApp e Instagram." },
          ].map((s, i) => (
            <div
              key={s.step}
              className="relative p-6 rounded-2xl bg-[#13131f] border border-white/[0.06] card-lift"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/40">
                {s.step}
              </div>
              <div className="text-[40px] mb-3 mt-2">{s.emoji}</div>
              <h3 className="text-[18px] font-black mb-2">{s.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 4. GRID DE PLANTILLAS ═════════════════════════════════════ */}
      <section className="px-5 py-12 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-1">
              Catálogo · {matches.length} plantillas
            </p>
            <h2 className="text-[22px] md:text-[28px] font-black leading-tight">
              Diseños listos para tu evento
            </h2>
          </div>
          <Link href="/templates" className="text-[12px] text-purple-300 font-bold hover:text-purple-200 transition-colors">
            Ver todas →
          </Link>
        </div>

        {matches.length === 0 ? (
          <p className="text-[13px] text-gray-400">
            Aún no tenemos plantillas en esta categoría.{" "}
            <Link href="/templates" className="text-purple-300 underline">Ver todas</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {matches.map((tpl) => (
              <Link
                key={tpl.id}
                href={`/editor/${tpl.id}`}
                className="group block rounded-2xl overflow-hidden bg-[#13131f] border border-white/[0.06] card-lift"
              >
                <div className="aspect-[4/5] relative bg-[#0a0a14] overflow-hidden">
                  {tpl.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={tpl.image}
                      alt={`Plantilla flyer ${tpl.title}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-[40px]">
                      {cat.emoji}
                    </div>
                  )}
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-[11px] font-black text-white bg-gradient-to-br from-purple-600 to-fuchsia-600 px-3 py-1.5 rounded-full">
                      Editar →
                    </span>
                  </div>
                </div>
                <div className="px-3 py-3">
                  <div className="text-[12px] font-bold truncate">{tpl.title}</div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                    {tpl.variants.length} formato{tpl.variants.length === 1 ? "" : "s"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══ 5. DEMO DEL EDITOR ════════════════════════════════════════ */}
      <section className="px-5 py-16 md:py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
              Editor mobile-first
            </p>
            <h2 className="text-[28px] md:text-[36px] font-black leading-tight mb-4">
              Edita como en{" "}
              <span className="shimmer-text">Canva</span>,{" "}
              desde tu móvil
            </h2>
            <ul className="space-y-3 mb-6">
              {[
                { icon: "✨", text: "Toca cualquier texto para editarlo en segundos" },
                { icon: "🪄", text: "Quita el fondo de fotos con IA en 2 segundos" },
                { icon: "🎨", text: "Cambia paleta + tipografía con 1 tap (Remix IA)" },
                { icon: "🤖", text: "Asistente IA rellena el flyer desde una descripción" },
                { icon: "📐", text: "Smart guides al arrastrar para alineación perfecta" },
                { icon: "📥", text: "Exporta PNG/JPG/PDF/SVG profesionales" },
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-gray-300">
                  <span className="text-[18px] shrink-0">{f.icon}</span>
                  <span className="leading-relaxed">{f.text}</span>
                </li>
              ))}
            </ul>
            {firstTemplate && (
              <Link
                href={`/editor/${firstTemplate.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-purple-500/30 text-purple-200 font-bold text-[13px] hover:bg-purple-500/10 transition-colors"
              >
                Prueba el editor →
              </Link>
            )}
          </div>
          <div className="relative animate-float">
            {/* Mockup phone frame con flyer dentro */}
            <div className="relative mx-auto max-w-[300px] aspect-[9/19] rounded-[36px] border-[6px] border-gray-800 bg-[#0a0a14] shadow-2xl shadow-purple-500/30 overflow-hidden">
              {firstTemplate?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={firstTemplate.image}
                  alt="Editor mobile demo"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[80px]">
                  {cat.emoji}
                </div>
              )}
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"/>
            </div>
            {/* Glow detrás */}
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-tr from-purple-500/30 via-fuchsia-500/20 to-pink-500/30 blur-3xl"/>
          </div>
        </div>
      </section>

      {/* ═══ 6. FAQ ════════════════════════════════════════════════════ */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
            FAQ
          </p>
          <h2 className="text-[24px] md:text-[32px] font-black leading-tight">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {cat.faq.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-[#13131f] border border-white/[0.06] px-5 py-4 hover:border-purple-500/30 transition-colors"
            >
              <summary className="text-[14px] font-bold cursor-pointer leading-snug flex items-center justify-between gap-3 list-none">
                <span>{f.q}</span>
                <span className="text-purple-300 group-open:rotate-45 transition-transform duration-300 text-[20px] leading-none shrink-0">
                  +
                </span>
              </summary>
              <p className="text-[13px] text-gray-300 leading-relaxed mt-3">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ 7. CTA FINAL ══════════════════════════════════════════════ */}
      <section className="px-5 py-16 max-w-4xl mx-auto">
        <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 bg-gradient-animated text-center">
          {/* Blob decorativo */}
          <div aria-hidden className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-blob"/>
          <div aria-hidden className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-blob animate-blob-delay-2"/>

          <div className="relative">
            <p className="text-[11px] uppercase tracking-widest font-bold text-white/80 mb-3">
              Empieza gratis · Sin tarjeta
            </p>
            <h2 className="text-[28px] md:text-[40px] font-black mb-3 leading-tight">
              Tu flyer profesional<br/>en 2 minutos
            </h2>
            <p className="text-[14px] text-white/90 leading-relaxed mb-6 max-w-md mx-auto">
              Plantillas optimizadas + IA que rellena el contenido + exportación en cualquier formato. Sin cursos. Sin software.
            </p>
            <Link
              href={firstTemplate ? `/editor/${firstTemplate.id}` : "/templates"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-purple-600 font-black text-[15px] active:scale-[0.97] transition-transform shadow-2xl shadow-black/30 animate-pulse-glow"
            >
              Crear mi flyer ahora →
            </Link>
            <p className="text-[10px] text-white/70 mt-4">
              Edita en móvil · 4 idiomas · Exporta PNG/PDF/SVG
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 8. OTRAS CATEGORÍAS — internal linking ════════════════════ */}
      <section className="px-5 py-12 max-w-6xl mx-auto border-t border-white/[0.06]">
        <h2 className="text-[16px] font-black mb-5 text-gray-300">
          Explora otras categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORY_SEO.filter(c => c.slug !== slug).map(c => (
            <Link
              key={c.slug}
              href={`/flyers/${c.slug}`}
              className="group flex items-start gap-3 p-4 rounded-2xl bg-[#13131f] border border-white/[0.06] card-lift"
            >
              <span className="text-[28px] leading-none shrink-0 group-hover:scale-110 transition-transform">{c.emoji}</span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-black leading-tight mb-1">
                  {c.h1.split(" ").slice(0, 4).join(" ")}…
                </h3>
                <span className="text-[11px] text-purple-300 font-bold">
                  Ver →
                </span>
              </div>
            </Link>
          ))}
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
          <p className="text-[11px] text-gray-500 mb-2">
            © ArteGenIA · Plantillas de flyers gratis · {new Date().getFullYear()}
          </p>
          <div className="flex justify-center gap-4 text-[11px] text-gray-500">
            <Link href="/" className="hover:text-purple-300 transition-colors">Inicio</Link>
            <Link href="/templates" className="hover:text-purple-300 transition-colors">Plantillas</Link>
            <Link href="/flyers" className="hover:text-purple-300 transition-colors">Categorías</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-gray-300">
      <span>{icon}</span>
      {text}
    </span>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[28px] md:text-[36px] font-black shimmer-text leading-none mb-1">
        {number}
      </div>
      <div className="text-[11px] md:text-[12px] text-gray-400 leading-tight">
        {label}
      </div>
    </div>
  );
}
