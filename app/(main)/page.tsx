"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Sparkles, ArrowRight,
  Zap, Star, Upload, Headphones,
  PartyPopper, Music, GraduationCap, Disc3, LayoutGrid,
  Image as ImageIcon, Edit3, Send,
  Users, Building2, BookOpen, User, Landmark, Briefcase, School,
  Heart,
} from "lucide-react";
// Solo metadata (sin layers) → no arrastra las ~383 KB del catálogo al
// first-load. Las layers se resuelven dentro del thumbnail (chunk lazy).
import { templatesMeta as catalogTemplates, type TemplateMeta } from "@/data/templatesMeta";
import type { AudienceId } from "@/data/templates";
import { useTemplateOverrideImages } from "@/hooks/useTemplateOverrideImages";
import type { FormatId } from "@/data/formats";
import { useLocale } from "@/hooks/useLocale";
import type { TranslationKey } from "@/lib/translations";
import HomeVsCanva from "@/components/home/HomeVsCanva";
// Carga diferida: arrastra framer-motion y 12 imagenes; no debe entrar en el
// first-load JS del home, que es la pagina que mas visitas recibe.
// Sin `ssr:false`: con esa opcion el limite de Suspense se quedaba en
// BAILOUT_TO_CLIENT_SIDE_RENDERING y el bloque no llegaba a montarse nunca.
// El componente ya protege todo lo que toca `window` dentro de useEffect.
const FlyerSurfer = dynamic(() => import("@/components/home/FlyerSurfer"));

// Lazy-load: TemplateFabricThumbnail arrastra Fabric.js (~320 KB). En la home
// son thumbnails decorativos, así que se cargan en un chunk aparte (ssr:false)
// y NO bloquean el first-load JS de la landing. Placeholder con el fondo del card.
const TemplateFabricThumbnail = dynamic(
  () => import("@/components/templates/TemplateFabricThumbnail"),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#0a0a12]" aria-hidden />,
  },
);

// ════════════════════════════════════════════════════════════════════════════
//  HOME — discovery con animacion de entrada, theme-aware (dark/light via
//  CSS vars) e i18n (es/en/fr/pt). Layout pensado para entrar SIN scroll en
//  desktop. En mobile scroll minimo.
//
//  Elementos visuales:
//   - Hero: titulo + CTA + STACK de 3 flyers escalonados (no 1)
//   - Animacion: cards entran rotadas con delay 100ms entre ellas
//   - Search + 3 filas de pills (categoria, formato, audience)
//   - Grid de 5 plantillas (favoritas + recientes)
//   - Steps + features en 1 fila compacta abajo
// ════════════════════════════════════════════════════════════════════════════

// ─── SOCIAL ICONS (lucide no incluye logos por trademark) ─────────────────
type SocialIconProps = { size?: number; className?: string };

function InstagramIcon({ size = 12, className = "" }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 12, className = "" }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.9h-2.33v6.98A10 10 0 0 0 22 12z" />
    </svg>
  );
}

// ─── ROTATING HIGHLIGHT ─────────────────────────────────────────────────
// Palabra final del titulo del hero ("...para tu evento") que va cambiando
// aleatoriamente entre tipos de evento, manteniendo el mismo gradiente.
// El cambio usa un cross-fade vertical corto; el ancho se autoajusta (es el
// ultimo elemento de la linea, asi que no provoca saltos de layout molestos).
function RotatingHighlight({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      // Tras el fade-out (300ms) elegir una palabra DISTINTA al azar y fade-in.
      setTimeout(() => {
        setIdx(prev => {
          let next = prev;
          while (next === prev) next = Math.floor(Math.random() * words.length);
          return next;
        });
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent inline-block transition-all duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(0.25em)",
      }}
    >
      {words[idx] ?? ""}
    </span>
  );
}

// ─── CATEGORIAS / FORMATOS / AUDIENCES ──────────────────────────────────
// `i18nKey` apunta a la key de traduccion en lib/translations.ts. Definidas
// fuera del componente para evitar rebuilds en cada render.

type CategoryOption = {
  key: "all" | string;
  i18nKey: "categories.all" | "categories.party" | "categories.concert" | "categories.classes" | "categories.festival" | "categories.club";
  icon: typeof PartyPopper;
  match: readonly string[] | null;
};

const CATEGORIES: CategoryOption[] = [
  { key: "all",       i18nKey: "categories.all",      icon: LayoutGrid,    match: null },
  { key: "Fiesta",    i18nKey: "categories.party",    icon: PartyPopper,   match: ["Fiesta"] },
  { key: "Concierto", i18nKey: "categories.concert",  icon: Music,         match: ["Concierto", "Conciertos"] },
  { key: "Clases",    i18nKey: "categories.classes",  icon: GraduationCap, match: ["Clases"] },
  { key: "Festival",  i18nKey: "categories.festival", icon: Sparkles,      match: ["Festival"] },
  { key: "Discoteca", i18nKey: "categories.club",     icon: Disc3,         match: ["Club / Discoteca"] },
];

type FormatOption = {
  key: FormatId | "all";
  i18nKey: "formats.all" | "formats.igPost" | "formats.igStory" | "formats.igSquare" | "formats.fbCover";
  Icon: (props: { size?: number; className?: string }) => React.ReactElement;
};

const FORMATS: FormatOption[] = [
  { key: "all",      i18nKey: "formats.all",      Icon: ({ size = 12, className }) => <LayoutGrid size={size} strokeWidth={2} className={className} /> },
  { key: "portrait", i18nKey: "formats.igPost",   Icon: InstagramIcon },
  { key: "story",    i18nKey: "formats.igStory",  Icon: InstagramIcon },
  { key: "square",   i18nKey: "formats.igSquare", Icon: InstagramIcon },
  { key: "fb-cover", i18nKey: "formats.fbCover",  Icon: FacebookIcon },
];

type AudienceOption = {
  key: AudienceId | "all";
  i18nKey: "audience.all" | "audience.producers" | "audience.academies" | "audience.freelance" | "audience.institutions" | "audience.agencies" | "audience.schools";
  icon: typeof Users;
};

const AUDIENCES: AudienceOption[] = [
  { key: "all",           i18nKey: "audience.all",          icon: Users },
  { key: "productoras",   i18nKey: "audience.producers",    icon: Building2 },
  { key: "academias",     i18nKey: "audience.academies",    icon: BookOpen },
  { key: "freelance",     i18nKey: "audience.freelance",    icon: User },
  { key: "instituciones", i18nKey: "audience.institutions", icon: Landmark },
  { key: "agencias",      i18nKey: "audience.agencies",     icon: Briefcase },
  { key: "colegios",      i18nKey: "audience.schools",      icon: School },
];

// Steps + features con i18n keys
const STEPS = [
  { n: 1, icon: ImageIcon, i18nKey: "home.steps.choose" as const },
  { n: 2, icon: Edit3,     i18nKey: "home.steps.customize" as const },
  { n: 3, icon: Send,      i18nKey: "home.steps.download" as const },
];

const FEATURES = [
  { icon: Zap,        i18nKey: "home.features.fast" as const },
  { icon: Star,       i18nKey: "home.features.pro" as const },
  { icon: Upload,     i18nKey: "home.features.ready" as const },
  { icon: Headphones, i18nKey: "home.features.support" as const },
];

// IDs de plantillas seleccionadas como destacadas en el home — las MAS
// visualmente fuertes del catalogo. Orden importa (las primeras tienen mas
// prominencia: hero stack + primeras 3 cards de "Favoritas y nuevas").
//
// Actualizadas a las nuevas clases/workshop con fotos de bailarines reales
// (alto contraste visual, gradientes saturados):
//   44 Kizomba Workshop · 43 Urban Hip-Hop · 42 Salsa Cubana ·
//   41 Tango Argentino · 38 Ciclo 3 Maestros · 37 Taller Flamenco ·
//   39 Bachata Principiantes · 40 Intensivo Bootcamp · 35 Workshop Bachata Sensual ·
//   17 Concierto Urban (conserva una favorita historica)
const FAVORITE_IDS = [44, 43, 42, 41, 38, 37, 39, 40, 35, 17];

export default function Home() {
  const { resolveImage } = useTemplateOverrideImages();
  const { t } = useLocale();

  const [selectedCat, setSelectedCat] = useState<CategoryOption["key"]>("all");
  const [selectedFormat, setSelectedFormat] = useState<FormatId | "all">("all");
  const [selectedAudience, setSelectedAudience] = useState<AudienceId | "all">("all");
  const [search, setSearch] = useState("");

  // Catalogo curado: favoritas primero (en orden), luego el resto id desc.
  const curatedTemplates = useMemo<TemplateMeta[]>(() => {
    const byId = new Map(catalogTemplates.map(t => [t.id, t] as const));
    const favs = FAVORITE_IDS.map(id => byId.get(id)).filter((t): t is TemplateMeta => !!t);
    const favIds = new Set(favs.map(t => t.id));
    const recents = catalogTemplates
      .filter(t => !favIds.has(t.id))
      .sort((a, b) => b.id - a.id);
    return [...favs, ...recents];
  }, []);

  // HERO: stack de 3 flyers (3 primeros del catalogo curado con square).
  // El central es el "featured" — los laterales son acompañantes visuales.
  const heroStack = useMemo<TemplateMeta[]>(() => {
    const withSquare = curatedTemplates.filter(t => t.variants.some(v => v.format === "square"));
    return withSquare.slice(0, 3);
  }, [curatedTemplates]);
  const featured = heroStack[0] ?? curatedTemplates[0];
  // Formato preferido para el card "Como funciona" — square si lo tiene,
  // si no el primero disponible. Necesario porque la prop formatId es required.
  const featuredFormat: FormatId =
    featured.variants.find(v => v.format === "square")?.format ?? featured.variants[0].format;

  const filtered = useMemo(() => {
    const catMatch = CATEGORIES.find(c => c.key === selectedCat)?.match;
    return curatedTemplates
      .filter(t => t.id !== featured.id)
      .filter(t => !catMatch || catMatch.includes(t.category))
      .filter(t => selectedFormat === "all" || t.variants.some(v => v.format === selectedFormat))
      .filter(t => selectedAudience === "all" || t.audience?.includes(selectedAudience))
      .filter(t => !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [curatedTemplates, selectedCat, selectedFormat, selectedAudience, search, featured.id]);

  const cardFormat: FormatId = selectedFormat === "all" ? "square" : selectedFormat;

  // Palabras que rota el highlight del hero (lista separada por comas en i18n).
  const rotatingWords = useMemo(
    () =>
      t("home.hero.title.rotating")
        .split(",")
        .map(w => w.trim())
        .filter(Boolean),
    [t],
  );

  return (
    <div style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-4">

        {/* ═════ HERO = CARRUSEL 3D DE FLYERS REALES ═════
            El titular (h1 con la palabra rotatoria), el subtitulo y los CTAs
            viven DENTRO de la escena; ya no hay un hero aparte encima. El h1
            sigue siendo el mismo y se renderiza en servidor, asi que el SEO no
            cambia — solo cambia donde se pinta.

            w-screen + left-1/2 -translate-x-1/2: el home vive dentro de un
            max-w-6xl centrado y esta seccion va de borde a borde. Con margenes
            negativos solo se recuperaba el padding, no el ancho maximo. */}
        <div className="relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] mb-6">
          <FlyerSurfer
            titulo={
              <h1 className="font-black leading-[1.02] tracking-tight text-white"
                  style={{ fontSize: "clamp(1.8rem, 4.4vw, 3.4rem)" }}>
                {t("home.hero.title.line1")} {t("home.hero.title.line2")}{" "}
                <RotatingHighlight words={rotatingWords} />
              </h1>
            }
            subtitulo={
              <p className="text-[13px] sm:text-[15px] mt-3 leading-snug text-white/70">
                {t("home.hero.subtitle")}
              </p>
            }
            acciones={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-transform hover:scale-[1.03]"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 22px rgba(168,85,247,0.4)" }}
                >
                  <Sparkles size={14} strokeWidth={2.2} />
                  {t("home.hero.cta")}
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-colors bg-white/[0.07] border border-white/15 hover:bg-white/[0.12]"
                >
                  <LayoutGrid size={14} strokeWidth={2.2} />
                  {t("home.hero.cta2")}
                </Link>
              </div>
            }
          />
        </div>

        {/* ═════ SEARCH + FILTROS ═════ */}
        <section className="mb-2 animate-home-fade delay-400">
          <div className="flex items-stretch gap-2">
            <div className="flex-1 relative">
              <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--home-text-soft)" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("home.search.placeholder")}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm outline-none transition-colors placeholder:opacity-60"
                style={{
                  background: "var(--home-card-bg)",
                  border: "1px solid var(--home-card-border)",
                  color: "var(--home-text)",
                }}
              />
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              style={{
                background: "var(--home-card-bg)",
                border: "1px solid var(--home-card-border)",
                color: "var(--home-text)",
              }}
            >
              <SlidersHorizontal size={13} strokeWidth={2} />
              <span className="hidden sm:inline">{t("home.search.filters")}</span>
            </Link>
          </div>
        </section>

        {/* ═════ PILLS CATEGORIA ═════ */}
        <PillRow>
          {CATEGORIES.map(c => (
            <PillButton key={c.key} active={selectedCat === c.key} onClick={() => setSelectedCat(c.key)} variant="purple">
              <c.icon size={12} strokeWidth={2} />
              {t(c.i18nKey)}
            </PillButton>
          ))}
        </PillRow>

        {/* ═════ PILLS FORMATO (con logos sociales) ═════ */}
        <PillRow>
          {FORMATS.map(f => {
            const Icon = f.Icon;
            return (
              <PillButton key={f.key} active={selectedFormat === f.key} onClick={() => setSelectedFormat(f.key)} variant="purple">
                <Icon size={12} />
                {t(f.i18nKey)}
              </PillButton>
            );
          })}
        </PillRow>

        {/* ═════ PILLS AUDIENCE "Para quien" ═════ */}
        <section className="mb-3 animate-home-fade delay-500">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <span className="shrink-0 text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-400/80 uppercase">
              {t("home.audience.label")}
            </span>
            {AUDIENCES.map(a => (
              <PillButton key={a.key} active={selectedAudience === a.key} onClick={() => setSelectedAudience(a.key)} variant="amber">
                <a.icon size={12} strokeWidth={2} />
                {t(a.i18nKey)}
              </PillButton>
            ))}
          </div>
        </section>

        {/* ═════ PLANTILLAS FAVORITAS Y NUEVAS (5 cards) ═════ */}
        <section className="mb-3 animate-home-fade delay-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base font-black inline-flex items-center gap-1.5">
              <Star size={13} strokeWidth={2.4} className="text-amber-400" fill="currentColor" />
              {t("home.popular.title")}
            </h2>
            <Link href="/templates" className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold">
              {t("home.popular.viewAll")}
              <ArrowRight size={12} strokeWidth={2.2} />
            </Link>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl py-6 text-center text-xs"
                 style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text-muted)" }}>
              {t("home.popular.empty")}
            </div>
          ) : (
            <div className="flex sm:grid sm:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              {filtered.map(t => {
                const hasFormat = t.variants.some(v => v.format === cardFormat);
                const useFormat: FormatId = hasFormat ? cardFormat : t.variants[0].format;
                return <TemplatePopularCard key={t.id} template={t} formatId={useFormat} />;
              })}
            </div>
          )}
        </section>

        {/* ═════ COMO FUNCIONA — VISUAL con flyer real + 3 pasos compactos ═════
            En lugar de 3 cards de texto verticales (boring), mostramos:
              - Mobile: flyer destacado grande arriba (animado), pasos como
                pills horizontales debajo
              - Desktop: flyer a la izquierda, pasos a la derecha
            Esto es lo mas cercano a "demo visual" sin tener video grabado.
            El flyer es real (TemplateFabricThumbnail) → el visitante VE
            la calidad antes de registrarse. */}
        <section className="mb-4 animate-home-fade delay-600">
          <h2 className="text-base sm:text-lg font-black mb-3 text-center sm:text-left">{t("home.howItWorks.title")}</h2>
          <div className="rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_1.3fr] gap-4 sm:gap-6 items-center"
               style={{
                 background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(124,58,237,0.03))",
                 border: "1px solid var(--home-card-border)",
               }}>
            {/* Flyer destacado real con animacion de glow */}
            {featured && (
              <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[220px] aspect-[4/5]">
                <div className="absolute inset-0 rounded-xl overflow-hidden"
                     style={{
                       boxShadow: "0 12px 40px rgba(168,85,247,0.35), 0 0 60px rgba(168,85,247,0.15)",
                       border: "1.5px solid rgba(168,85,247,0.4)",
                     }}>
                  <TemplateFabricThumbnail
                    template={featured}
                    formatId={featuredFormat}
                    overrideImageUrl={resolveImage(featured.id, "") || undefined}
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                {/* Badge "Ejemplo real" */}
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider"
                     style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)", color: "#000", boxShadow: "0 4px 10px rgba(250,204,21,0.4)" }}>
                  EJEMPLO REAL
                </div>
              </div>
            )}

            {/* 3 pasos compactos al lado/abajo */}
            <div className="space-y-2.5 sm:space-y-3">
              {STEPS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.n} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                           style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 12px rgba(168,85,247,0.35)" }}>
                        <Icon size={16} strokeWidth={2} className="text-white" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                            style={{ background: "#fff", color: "#7c3aed", border: "2px solid var(--home-bg)" }}>
                        {s.n}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--home-text)" }}>
                        {t(s.i18nKey)}
                      </h3>
                      <p className="text-[11px] leading-snug" style={{ color: "var(--home-text-muted)" }}>
                        {t(`${s.i18nKey}.sub` as TranslationKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <Link
                href="/templates"
                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl font-bold text-xs text-white transition-transform hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 14px rgba(168,85,247,0.35)" }}
              >
                <Sparkles size={12} strokeWidth={2.4} />
                Empezar ahora
              </Link>
            </div>
          </div>
        </section>

        {/* ═════ FEATURES — 4 cards en una fila ═════ */}
        <section className="animate-home-fade delay-600">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 rounded-2xl p-3 sm:p-4"
               style={{
                 background: "linear-gradient(180deg, var(--home-feature-bg), var(--home-feature-bg2))",
                 border: "1px solid var(--home-feature-border)",
               }}>
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.i18nKey} className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
                       style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}>
                    <Icon size={16} strokeWidth={2} className="text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold mb-0.5 truncate" style={{ color: "var(--home-text)" }}>
                      {t(f.i18nKey)}
                    </h4>
                    <p className="text-[10px] sm:text-xs leading-tight truncate" style={{ color: "var(--home-text-muted)" }}>
                      {t(`${f.i18nKey}.sub` as TranslationKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═════ ¿PARA QUIÉN ES? — scroll horizontal mobile, grid desktop ═════ */}
        {/* En mobile: 4 cards en scroll horizontal (mas digerible que grid vertical).
            En desktop: grid de 4 columnas. Cada card mas grande, mas visual,
            con accent color de fondo (no solo borde) para destacar. */}
        <section className="mt-10 sm:mt-14">
          <h2 className="text-xl sm:text-2xl font-black text-center mb-1" style={{ color: "var(--home-text)" }}>
            Sea cual sea tu evento
          </h2>
          <p className="text-sm text-center mb-5 max-w-xl mx-auto" style={{ color: "var(--home-text-muted)" }}>
            Diseñado para tu tipo de público.
          </p>
          {/* Los 4 audiences reales (v2, 2 jul 2026) — descartamos "DJ
              genérico" tras validar con el mercado. Los que SÍ tienen dolor:
              1. Sala / promotor de club (2-3 flyers/semana)
              2. DJ móvil / bodas (cada cliente su flyer)
              3. DJ residente (su noche semanal en sala pequeña)
              4. Academia (cursos, talleres, workshops) */}
          <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-2">
            <AudienceCard icon={Music}         accent="#22d3ee" title="Sala / Club"       desc="2-3 flyers por semana en 5 min cada uno."   href="/para-salas" />
            <AudienceCard icon={PartyPopper}   accent="#ec4899" title="DJ móvil / Bodas"  desc="Cada cliente su flyer sin pagar diseñador." href="/para-djs-boda" />
            <AudienceCard icon={Sparkles}      accent="#facc15" title="DJ residente"     desc="Tu noche semanal, siempre lista a tiempo."   href="/para-djs" />
            <AudienceCard icon={GraduationCap} accent="#a855f7" title="Academia"          desc="Capta alumnos con clases y workshops."       href="/para-academias" />
          </div>
        </section>

        {/* ═════ EST#14 — Comparativa vs Canva (argumento competitivo) ═════ */}
        <HomeVsCanva />

        {/* ═════ Anti-clon vs ChatGPT — feedback estratégico 2 jul 2026 ═════
             Muchos organizadores están usando ChatGPT/MidJourney → todos los
             flyers acaban pareciéndose (mismo look magenta+cyan, fondos hiper-
             realistas idénticos). Este teaser dirige a /vs-chatgpt donde la
             tesis se desarrolla con evidencia visual + comparativa. */}
        <section className="mt-10 sm:mt-14">
          <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
               style={{
                 background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(168,85,247,0.06))",
                 border: "1px solid rgba(239,68,68,0.25)",
               }}>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 mb-3">
                <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest">
                  El problema del clon
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black mb-2 leading-tight" style={{ color: "var(--home-text)" }}>
                Todos usan ChatGPT para flyers.{" "}
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Todos acaban con el mismo flyer.
                </span>
              </h2>
              <p className="text-sm max-w-2xl mb-5" style={{ color: "var(--home-text-muted)" }}>
                El promotor con ChatGPT es reemplazable. El promotor con ArteGenIA construye
                <strong style={{ color: "var(--home-text)" }}> identidad visual propia</strong> que se reconoce a distancia.
              </p>
              <Link
                href="/vs-chatgpt"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-transform hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #a855f7)",
                  boxShadow: "0 8px 20px rgba(239,68,68,0.3)",
                }}
              >
                Ver la evidencia →
              </Link>
            </div>
          </div>
        </section>

        {/* ═════ FAQ — 3 preguntas (era 4) ═════ */}
        <section className="mt-10 sm:mt-14">
          <h2 className="text-xl sm:text-2xl font-black text-center mb-5" style={{ color: "var(--home-text)" }}>
            Preguntas frecuentes
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            <FaqItem
              q="¿Tengo que pagar para empezar?"
              a="No. Crea cuenta y empieza gratis. Las funciones de IA tienen 10 usos/mes sin pagar nada."
            />
            <FaqItem
              q="¿Mis diseños llevan marca de agua?"
              a="Solo en plan gratis. El plan Pro descarga sin marca."
            />
            <FaqItem
              q="¿Funciona en mi móvil?"
              a="Sí. Editor optimizado para iPhone/Android. Edita y descarga sobre la marcha."
            />
          </div>
        </section>

        {/* ═════ CTA FINAL — última oportunidad de conversión ═════ */}
        <section className="mt-12 sm:mt-16 mb-4 rounded-3xl p-6 sm:p-10 text-center"
                 style={{
                   background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.06))",
                   border: "1px solid var(--ag-brand-border)",
                 }}>
          <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--home-text)" }}>
            Tu próximo flyer en{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              2 minutos
            </span>
          </h2>
          <p className="text-sm sm:text-base mb-6 max-w-md mx-auto" style={{ color: "var(--home-text-muted)" }}>
            Elige una plantilla, cámbiale el texto, descarga. Así de simple.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-base text-white transition-transform hover:scale-[1.05]"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              boxShadow: "0 0 40px rgba(168,85,247,0.45)",
            }}
          >
            <Sparkles size={18} strokeWidth={2.2} />
            Crear mi primer flyer gratis
            <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: "var(--home-text-soft)" }}>
            Sin tarjeta · Cancela cuando quieras · 100% en español
          </p>
        </section>

      </div>
    </div>
  );
}

// ─── Cards de landing (auto-contenidas, no se reutilizan fuera del home) ──

/** AudienceCard — visual con bg gradient del accent color (no solo border).
 *  Mas atractivo visualmente en mobile donde el contraste con fondo claro
 *  era casi imperceptible. Ancho fijo en mobile para scroll horizontal.
 *
 *  Con href se convierte en Link a la landing específica del segmento
 *  (/para-salas, /para-djs-boda, etc.) para conversión SEO segmentada.
 *  Sin href se comporta como el card estático original. */
function AudienceCard({ icon: Icon, accent, title, desc, href }: {
  icon: typeof GraduationCap;
  accent: string;
  title: string;
  desc: string;
  href?: string;
}) {
  const inner = (
    <>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: accent,
          color: "#fff",
          boxShadow: `0 6px 16px ${accent}60`,
        }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <h3 className="text-sm sm:text-base font-bold mb-1" style={{ color: "var(--home-text)" }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--home-text-muted)" }}>
        {desc}
      </p>
    </>
  );
  const cardCls = "shrink-0 w-[200px] sm:w-auto rounded-2xl p-4 transition-transform hover:scale-[1.02] block";
  const cardStyle = {
    background: `linear-gradient(135deg, ${accent}14, ${accent}06)`,
    border: `1.5px solid ${accent}40`,
  };
  if (href) {
    return (
      <Link href={href} className={cardCls} style={cardStyle}>
        {inner}
      </Link>
    );
  }
  return <div className={cardCls} style={cardStyle}>{inner}</div>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="rounded-xl p-4 group"
      style={{
        background: "var(--home-bg-soft)",
        border: "1px solid var(--home-card-border)",
      }}
    >
      <summary className="cursor-pointer text-sm font-bold flex items-center justify-between gap-3 list-none"
               style={{ color: "var(--home-text)" }}>
        {q}
        <span className="text-lg transition-transform group-open:rotate-45 shrink-0" style={{ color: "var(--ag-brand)" }}>+</span>
      </summary>
      <p className="text-xs leading-relaxed mt-2" style={{ color: "var(--home-text-muted)" }}>
        {a}
      </p>
    </details>
  );
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────

/** Fila scroll horizontal de pills con margin-bottom estandar. */
function PillRow({ children }: { children: React.ReactNode }) {
  return (
    <section className="mb-1.5 animate-home-fade delay-400">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">{children}</div>
    </section>
  );
}

/** Pill toggleable con dos variantes de active color (purple/amber). */
function PillButton({
  active,
  onClick,
  children,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant: "purple" | "amber";
}) {
  const activeStyle =
    variant === "purple"
      ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 12px rgba(168,85,247,0.3)", color: "#fff" }
      : { background: "linear-gradient(135deg,#facc15,#f59e0b)", boxShadow: "0 0 12px rgba(250,204,21,0.35)", color: "#000" };

  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all"
      style={
        active
          ? activeStyle
          : {
              background: "var(--home-card-bg)",
              border: "1px solid var(--home-card-border)",
              color: "var(--home-pill-text)",
            }
      }
    >
      {children}
    </button>
  );
}

/** Card de plantilla — estilo mockup: tags arriba (categoria + formato),
 *  imagen del flyer, debajo del area de imagen el bloque info con titulo,
 *  meta (categoria + formato icon), CTA "Usar plantilla" y corazon favorito.
 *
 *  El corazon es visual por ahora (sin persistencia) — para activar favoritos
 *  hace falta tabla `favorites` en Supabase. TODO post-MVP. */
function TemplatePopularCard({
  template,
  formatId,
}: {
  template: TemplateMeta;
  formatId: FormatId;
}) {
  const { t } = useLocale();
  const [liked, setLiked] = useState(false);

  // Label corto del formato para el meta — buscamos en FORMATS por la key
  // que matchee con el formatId actual de esta card.
  const formatLabelKey = FORMATS.find(f => f.key === formatId)?.i18nKey;
  const formatLabel = formatLabelKey ? t(formatLabelKey) : formatId;
  return (
    <div
      className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02] shrink-0 w-[180px] sm:w-auto"
      style={{
        background: "var(--home-bg-soft)",
        border: "1px solid var(--home-card-border)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
      }}
    >
      {/* Image area — clickable */}
      <Link href={`/editor/${template.id}?format=${formatId}`} className="relative block aspect-[4/5] overflow-hidden">
        <TemplateFabricThumbnail
          template={template}
          formatId={formatId}
          className="absolute inset-0 h-full w-full"
        />
        {/* Tags arriba: categoria izquierda + formato derecha (mockup-faithful) */}
        <div className="absolute top-1.5 left-1.5 right-1.5 z-10 flex items-start justify-between gap-1">
          <span className="text-[8px] sm:text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-sm border border-white/15 truncate max-w-[60%]">
            {template.category}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-black/70 text-purple-300 backdrop-blur-sm border border-purple-400/30 truncate max-w-[40%]">
            {formatLabel}
          </span>
        </div>
      </Link>

      {/* Info block — titulo + CTA + corazon. Fuera del Link para que el
          corazon no dispare navegacion. */}
      <div className="p-2.5 sm:p-3">
        <h3 className="text-xs sm:text-sm font-bold leading-tight mb-2 truncate" style={{ color: "var(--home-text)" }}>
          {template.title}
        </h3>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/editor/${template.id}?format=${formatId}`}
            className="flex-1 text-center text-[10px] sm:text-xs font-bold py-1.5 rounded-lg text-white transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }}
          >
            {t("home.popular.use")}
          </Link>
          <button
            onClick={() => setLiked(v => !v)}
            aria-label="favorite"
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}
          >
            <Heart
              size={13}
              strokeWidth={2}
              className={liked ? "text-pink-400" : ""}
              style={!liked ? { color: "var(--home-text-muted)" } : {}}
              fill={liked ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
