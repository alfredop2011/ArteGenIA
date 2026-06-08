"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Sparkles, ArrowRight,
  Zap, Star, Upload, Headphones,
  PartyPopper, Music, GraduationCap, Disc3, LayoutGrid,
  Image as ImageIcon, Edit3, Send,
  Users, Building2, BookOpen, User, Landmark, Briefcase, School,
  Heart,
} from "lucide-react";
import { templates as catalogTemplates, type Template, type AudienceId } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import TemplateFabricThumbnail from "@/components/templates/TemplateFabricThumbnail";
import { useLocale } from "@/hooks/useLocale";
import type { TranslationKey } from "@/lib/translations";

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
  const { t } = useLocale();

  const [selectedCat, setSelectedCat] = useState<CategoryOption["key"]>("all");
  const [selectedFormat, setSelectedFormat] = useState<FormatId | "all">("all");
  const [selectedAudience, setSelectedAudience] = useState<AudienceId | "all">("all");
  const [search, setSearch] = useState("");

  // Catalogo curado: favoritas primero (en orden), luego el resto id desc.
  const curatedTemplates = useMemo<Template[]>(() => {
    const byId = new Map(catalogTemplates.map(t => [t.id, t] as const));
    const favs = FAVORITE_IDS.map(id => byId.get(id)).filter((t): t is Template => !!t);
    const favIds = new Set(favs.map(t => t.id));
    const recents = catalogTemplates
      .filter(t => !favIds.has(t.id))
      .sort((a, b) => b.id - a.id);
    return [...favs, ...recents];
  }, []);

  // HERO: stack de 3 flyers (3 primeros del catalogo curado con square).
  // El central es el "featured" — los laterales son acompañantes visuales.
  const heroStack = useMemo<Template[]>(() => {
    const withSquare = curatedTemplates.filter(t => t.variants.some(v => v.format === "square"));
    return withSquare.slice(0, 3);
  }, [curatedTemplates]);
  const featured = heroStack[0] ?? curatedTemplates[0];

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

  return (
    <div style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-4">

        {/* ═════ HERO: titulo izq + stack 3 flyers dcha (animacion entrada) ═════ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 lg:gap-6 items-center mb-3 sm:mb-4">
          {/* Left: titulo + CTA con fade-in escalonado */}
          <div>
            <h1 className="font-black leading-[1.05] tracking-tight animate-home-fade"
                style={{ fontSize: "clamp(1.7rem, 4.2vw, 3rem)" }}>
              {t("home.hero.title.line1")} {t("home.hero.title.line2")}{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                {t("home.hero.title.highlight")}
              </span>
            </h1>
            <p className="text-xs sm:text-sm mt-2 max-w-md animate-home-fade delay-100"
               style={{ color: "var(--home-text-muted)" }}>
              {t("home.hero.subtitle")}
            </p>
            {/* CTA principal + secundario. El secundario reusa el mismo
                destino (/templates) — actua como entry visual alternativa
                "ver categorias" para usuarios que prefieren explorar grid. */}
            <div className="flex flex-wrap items-center gap-2 mt-3 animate-home-fade delay-200">
              <Link
                href="/templates"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-transform hover:scale-[1.03]"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 22px rgba(168,85,247,0.4)" }}
              >
                <Sparkles size={14} strokeWidth={2.2} />
                {t("home.hero.cta")}
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors"
                style={{
                  background: "var(--home-card-bg)",
                  border: "1px solid var(--home-card-border)",
                  color: "var(--home-text)",
                }}
              >
                <LayoutGrid size={14} strokeWidth={2.2} />
                {t("home.hero.cta2")}
              </Link>
            </div>
          </div>

          {/* Right: STACK 3 flyers (lateral izq rotado, centro grande, lateral
              dcha rotado). Cada uno con animacion home-card-in escalonada. */}
          <div className="relative h-[260px] sm:h-[300px] lg:h-[320px] flex items-center justify-center">
            {heroStack[1] && (
              <HeroStackCard
                template={heroStack[1]}
                position="left"
                animDelay={300}
              />
            )}
            {heroStack[0] && (
              <HeroStackCard
                template={heroStack[0]}
                position="center"
                animDelay={100}
                featuredLabel={t("home.hero.featured")}
              />
            )}
            {heroStack[2] && (
              <HeroStackCard
                template={heroStack[2]}
                position="right"
                animDelay={500}
              />
            )}
          </div>
        </section>

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

        {/* ═════ COMO FUNCIONA — 3 cards grandes con numero + icono + texto ═════ */}
        {/* Layout fiel al mockup: card oscura con borde, icono cuadrado morado
            a la izquierda con badge numero, titulo y subtitulo a la derecha.
            Lineas punteadas conectoras entre cards en desktop. */}
        <section className="mb-4 animate-home-fade delay-600">
          <h2 className="text-base sm:text-lg font-black mb-3">{t("home.howItWorks.title")}</h2>
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className="relative rounded-2xl p-3 sm:p-4 flex items-center gap-3"
                  style={{
                    background: "var(--home-card-bg)",
                    border: "1px solid var(--home-card-border)",
                  }}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                         style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                      <Icon size={20} strokeWidth={1.9} className="text-purple-400" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-black flex items-center justify-center"
                          style={{ border: "2px solid var(--home-bg)" }}>
                      {s.n}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold mb-0.5" style={{ color: "var(--home-text)" }}>
                      {t(s.i18nKey)}
                    </h3>
                    <p className="text-[10px] sm:text-xs leading-relaxed" style={{ color: "var(--home-text-muted)" }}>
                      {t(`${s.i18nKey}.sub` as TranslationKey)}
                    </p>
                  </div>
                  {/* Linea punteada conectora — solo desktop, no en el ultimo */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:flex absolute top-1/2 left-[calc(100%+0.25rem)] w-3.5 -translate-y-1/2 items-center justify-center pointer-events-none">
                      <div className="w-full border-t border-dashed border-purple-500/40" />
                    </div>
                  )}
                </div>
              );
            })}
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

      </div>
    </div>
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

/** Card del stack del hero. 3 posiciones (left/center/right) con rotacion
 *  + escala distinta. La central destaca; las laterales son visuales. */
function HeroStackCard({
  template,
  position,
  animDelay,
  featuredLabel,
}: {
  template: Template;
  position: "left" | "center" | "right";
  animDelay: number;
  featuredLabel?: string;
}) {
  const variantSquare = template.variants.find(v => v.format === "square");
  const formatId: FormatId = variantSquare?.format ?? template.variants[0].format;

  // Estilos por posicion. La rotacion final se aplica via CSS var consumida
  // por la animacion home-card-in (asi la rotacion sobrevive al fin del anim).
  const styles: React.CSSProperties =
    position === "center"
      ? {
          ["--home-card-rot" as never]: "0deg",
          zIndex: 3,
          width: "min(60%, 220px)",
          aspectRatio: "1 / 1",
          boxShadow: "0 0 40px rgba(168,85,247,0.45), 0 25px 50px rgba(0,0,0,0.55)",
          border: "1.5px solid rgba(168,85,247,0.55)",
        }
      : position === "left"
      ? {
          ["--home-card-rot" as never]: "-12deg",
          zIndex: 2,
          width: "min(45%, 165px)",
          aspectRatio: "1 / 1",
          left: 0,
          top: "10%",
          boxShadow: "0 18px 35px rgba(0,0,0,0.45)",
          border: "1px solid var(--home-card-border)",
        }
      : {
          ["--home-card-rot" as never]: "12deg",
          zIndex: 2,
          width: "min(45%, 165px)",
          aspectRatio: "1 / 1",
          right: 0,
          top: "10%",
          boxShadow: "0 18px 35px rgba(0,0,0,0.45)",
          border: "1px solid var(--home-card-border)",
        };

  const isCenter = position === "center";

  return (
    <Link
      href={`/editor/${template.id}?format=${formatId}`}
      className={`absolute rounded-2xl overflow-hidden block group animate-home-card ${
        isCenter ? "hover:scale-[1.03]" : "hover:scale-[1.05]"
      } transition-transform`}
      style={{ ...styles, animationDelay: `${animDelay}ms` }}
    >
      <TemplateFabricThumbnail
        template={template}
        formatId={formatId}
        className="absolute inset-0 h-full w-full"
      />
      {isCenter && featuredLabel && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full text-black"
                style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)", boxShadow: "0 3px 12px rgba(250,204,21,0.4)" }}>
            <Star size={9} strokeWidth={2.5} fill="currentColor" />
            {featuredLabel}
          </span>
        </div>
      )}
    </Link>
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
  template: Template;
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
