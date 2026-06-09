"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid, List, Search, Plus, Heart, MoreVertical,
  Sparkles, Crown, ChevronDown, ChevronRight,
  PartyPopper, Mic2, Star, Footprints, BriefcaseBusiness,
  Megaphone, Ticket, Rocket, GraduationCap,
  Music, Maximize2, Upload, FolderOpen, Palette, Type,
  Home as HomeIcon, FileText, Users, History as HistoryIcon,
  type LucideIcon,
} from "lucide-react";
import { templates, type Template, type AudienceId, type TemplateVariant, type UseCase } from "@/data/templates";
import { type FormatId } from "@/data/formats";
import TemplateFabricThumbnail from "@/components/templates/TemplateFabricThumbnail";
import FormatPickerModal from "@/components/templates/FormatPickerModal";
import { supabase, type TemplatePublished } from "@/lib/supabase";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import type { TranslationKey } from "@/lib/translations";
import { matchesUseCase } from "@/lib/useCases";

// ════════════════════════════════════════════════════════════════════════════
//  /templates — Discovery page rediseñada (mockup ChatGPT-like).
//
//  Layout 3 columnas desktop:
//    [Sidebar 280px] [Main content 1fr] [Right rail 240px]
//
//  En mobile colapsa a 1 columna (drawer para sidebar/right rail).
// ════════════════════════════════════════════════════════════════════════════

// ─── ICONOS DE REDES SOCIALES (SVG inline) ────────────────────────────────
type SocialProps = { size?: number; className?: string };

function InstagramIcon({ size = 18, className = "" }: SocialProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function FacebookIcon({ size = 18, className = "" }: SocialProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.9h-2.33v6.98A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function TikTokIcon({ size = 18, className = "" }: SocialProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.69a4.77 4.77 0 0 1-1.84-.01z"/>
    </svg>
  );
}
function WhatsAppIcon({ size = 18, className = "" }: SocialProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5 1.7.7 2.4.8 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
    </svg>
  );
}
function LinkedInIcon({ size = 18, className = "" }: SocialProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.37 4.27 5.47v6.27zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"/>
    </svg>
  );
}
function YouTubeIcon({ size = 18, className = "" }: SocialProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.5 6.2c-.3-1-1-1.8-2-2C19.5 3.7 12 3.7 12 3.7s-7.5 0-9.5.5c-1 .3-1.8 1-2 2C0 8.2 0 12 0 12s0 3.8.5 5.8c.3 1 1 1.8 2 2 2 .5 9.5.5 9.5.5s7.5 0 9.5-.5c1-.3 1.8-1 2-2 .5-2 .5-5.8.5-5.8s0-3.8-.5-5.8zM9.5 15.5v-7l6.5 3.5-6.5 3.5z"/>
    </svg>
  );
}

// ─── DATOS DE REDES (PUBLICAR EN) ────────────────────────────────────────
// Cada red mapea a un formato del catalogo (FormatId) cuando aplica.
// Si seleccionas una, el grid filtra por ese formato automaticamente.
type PublishOption = {
  key: string;
  i18nKey: TranslationKey;
  format: FormatId | null; // null = no filter (custom o sin equivalente)
  ratio: string;            // texto debajo (ej "9:16")
  brandColor: string;       // hex para el fondo del logo
  Icon: (p: SocialProps) => React.ReactElement;
};

const PUBLISH_NETWORKS: PublishOption[] = [
  { key: "ig-feed",  i18nKey: "templates.publish.igFeed",   format: "square",   ratio: "Feed",  brandColor: "#E1306C", Icon: InstagramIcon },
  { key: "ig-story", i18nKey: "templates.publish.igStory",  format: "story",    ratio: "9:16",  brandColor: "#833AB4", Icon: InstagramIcon },
  { key: "tiktok",   i18nKey: "templates.publish.tiktok",   format: "story",    ratio: "9:16",  brandColor: "#000000", Icon: TikTokIcon },
  { key: "facebook", i18nKey: "templates.publish.facebook", format: "fb-cover", ratio: "16:9",  brandColor: "#1877F2", Icon: FacebookIcon },
  { key: "whatsapp", i18nKey: "templates.publish.whatsapp", format: "story",    ratio: "9:16",  brandColor: "#25D366", Icon: WhatsAppIcon },
  { key: "linkedin", i18nKey: "templates.publish.linkedin", format: "portrait", ratio: "Post",  brandColor: "#0A66C2", Icon: LinkedInIcon },
  { key: "youtube",  i18nKey: "templates.publish.youtube",  format: "fb-cover", ratio: "16:9",  brandColor: "#FF0000", Icon: YouTubeIcon },
];

// ─── USE CASES (¿PARA QUÉ LO NECESITAS?) ─────────────────────────────────
// Pills de propósito. `id` debe matchear con el tipo UseCase para que el
// filtro pase directo a matchesUseCase(). "all" es virtual (sin filtro).
type UseCaseOption = { id: UseCase | "all"; i18nKey: TranslationKey; icon: LucideIcon };
const USE_CASES: UseCaseOption[] = [
  { id: "all",             i18nKey: "categories.all",                    icon: LayoutGrid },
  { id: "promote",         i18nKey: "templates.useCase.promote",         icon: Megaphone },
  { id: "sellTickets",     i18nKey: "templates.useCase.sellTickets",     icon: Ticket },
  { id: "launch",          i18nKey: "templates.useCase.launch",          icon: Rocket },
  { id: "attractStudents", i18nKey: "templates.useCase.attractStudents", icon: GraduationCap },
  { id: "announceArtist",  i18nKey: "templates.useCase.announceArtist",  icon: Star },
];

// ─── CATEGORIAS y AUDIENCES (sidebar filtros) ────────────────────────────
type CategoryItem = { id: string; i18nKey: TranslationKey; icon: LucideIcon };
type AudienceItem = { id: AudienceId; i18nKey: TranslationKey; icon: LucideIcon };

const CATEGORIES: CategoryItem[] = [
  { id: "todas",      i18nKey: "categories.all",            icon: LayoutGrid },
  { id: "fiesta",     i18nKey: "categories.party",          icon: PartyPopper },
  { id: "concierto",  i18nKey: "templates.cat.concerts",    icon: Mic2 },
  { id: "festival",   i18nKey: "categories.festival",       icon: Star },
  { id: "clases",     i18nKey: "templates.cat.classesDance",icon: Footprints },
  { id: "discoteca",  i18nKey: "templates.cat.clubDisco",   icon: Music },
  { id: "gala",       i18nKey: "templates.cat.corporate",   icon: BriefcaseBusiness },
];

const AUDIENCES: AudienceItem[] = [
  { id: "academias",     i18nKey: "audience.academies",    icon: GraduationCap },
  { id: "productoras",   i18nKey: "audience.producers",    icon: BriefcaseBusiness },
  { id: "freelance",     i18nKey: "audience.freelance",    icon: Palette },
  { id: "instituciones", i18nKey: "audience.institutions", icon: BriefcaseBusiness },
  { id: "agencias",      i18nKey: "audience.agencies",     icon: Megaphone },
  { id: "colegios",      i18nKey: "audience.schools",      icon: GraduationCap },
];

// Sidebar nav (separado del nav global porque el mockup lo duplica aqui).
type SidebarNavItem = { href: string; i18nKey: TranslationKey; icon: LucideIcon };
const SIDEBAR_NAV: SidebarNavItem[] = [
  { href: "/",              i18nKey: "templates.nav.home",       icon: HomeIcon },
  { href: "/templates",     i18nKey: "nav.templates",            icon: FileText },
  { href: "/projects",      i18nKey: "nav.projects",             icon: FolderOpen },
  { href: "/colaboradores", i18nKey: "nav.collaborators",        icon: Users },
  { href: "/history",       i18nKey: "nav.history",              icon: HistoryIcon },
  { href: "/projects?tab=favorites", i18nKey: "templates.nav.favorites", icon: Heart },
];

// Aspect ratios para mostrar bien cada formato en el grid
const FORMAT_ASPECT: Record<FormatId, string> = {
  "square":       "1 / 1",
  "portrait":     "4 / 5",
  "story":        "9 / 16",
  "print":        "1240 / 1748",
  "fb-cover":     "1920 / 1005",
  "flyer-legacy": "430 / 540",
};

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════

export default function TemplatesPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user, profile } = useAuth();

  const [activeFormat, setActiveFormat] = useState<FormatId>("portrait");
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("todas");
  const [activeAudiences, setActiveAudiences] = useState<AudienceId[]>([]);
  const [activeUseCase, setActiveUseCase] = useState<UseCase | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalTemplate, setModalTemplate] = useState<Template | null>(null);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  // Vista grid (tarjetas) o list (filas horizontales). Persistido por sesion
  // — al recargar empieza en grid (mas comun). Para persistencia entre
  // sesiones se puede mover a localStorage.
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(10);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Toggle favorito (solo visual por ahora — sin persistencia Supabase)
  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── PLANTILLAS PUBLICADAS (Supabase admin) ──────────────────────────
  const [publishedTemplates, setPublishedTemplates] = useState<Template[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("templates_published")
          .select("*")
          .order("published_at", { ascending: false });
        if (error) { console.warn("[templates] no se pudo cargar publicadas:", error.message); return; }
        const pubs = (data ?? []) as TemplatePublished[];
        const converted: Template[] = pubs.map((p, idx) => ({
          id: -1000 - idx,
          title: p.title,
          category: p.category,
          image: p.thumbnail_url ?? "",
          premium: p.premium,
          audience: p.audience as AudienceId[],
          internalTags: ["beta"],
          variants: (p.variants as TemplateVariant[]) ?? [],
          __publishedId: p.id,
        } as Template & { __publishedId: string }));
        setPublishedTemplates(converted);
      } catch (e) {
        console.warn("[templates] error inesperado:", e);
      }
    })();
  }, []);

  const allTemplates = useMemo(() => [...publishedTemplates, ...templates], [publishedTemplates]);

  // ─── Handler: usar plantilla ─────────────────────────────────────────
  const handleUseTemplate = (template: Template) => {
    const tpl = template as Template & { __publishedId?: string };
    const idForUrl = tpl.__publishedId ? `published-${tpl.__publishedId}` : String(template.id);
    const directVariant = template.variants.find(v => v.format === activeFormat);
    if (directVariant) { router.push(`/editor/${idForUrl}?format=${activeFormat}`); return; }
    if (template.variants.length <= 1) {
      const fmt = template.variants[0]?.format;
      router.push(fmt ? `/editor/${idForUrl}?format=${fmt}` : `/editor/${idForUrl}`);
      return;
    }
    setModalTemplate(template);
  };

  // ─── Filtrado ────────────────────────────────────────────────────────
  const toggleAudience = (id: AudienceId) => {
    setActiveAudiences(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    const list = allTemplates.filter((tpl) => {
      const matchFormat = tpl.variants.some(v => v.format === activeFormat);
      if (!matchFormat) return false;
      const cat = tpl.category.toLowerCase();
      const matchCat = activeCategory === "todas"
        || cat === activeCategory
        || cat.includes(activeCategory)
        || activeCategory.includes(cat.split(" ")[0])
        || (activeCategory === "gala" && cat.includes("corporativo"))
        || (activeCategory === "discoteca" && cat.includes("club"));
      const matchAudience = activeAudiences.length === 0 ||
        activeAudiences.every(a => tpl.audience.includes(a));
      const matchSearch = searchQuery === "" ||
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      // Use case: usa inferUseCases() via helper. "all" no filtra.
      const matchUseCase = matchesUseCase(tpl, activeUseCase);
      return matchCat && matchAudience && matchSearch && matchUseCase;
    });
    return [...list].sort((a, b) => {
      const aPub = a.id < 0; const bPub = b.id < 0;
      if (aPub && !bPub) return -1;
      if (!aPub && bPub) return 1;
      if (aPub && bPub) return a.id - b.id;
      return b.id - a.id; // mas recientes primero
    });
  }, [allTemplates, activeFormat, activeCategory, activeAudiences, searchQuery, activeUseCase]);

  // Slice paginado en cliente — "Cargar mas" suma 10
  const visibleTemplates = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Cuando cambia el filtro, reseteamos visibleCount
  useEffect(() => { setVisibleCount(10); }, [activeFormat, activeCategory, activeAudiences, searchQuery, activeUseCase]);

  const clearFilters = () => {
    setActiveFormat("portrait");
    setActiveCategory("todas");
    setActiveAudiences([]);
    setActiveUseCase("all");
    setActiveNetwork(null);
    setSearchQuery("");
  };

  // Selector de red social: cambia tambien el formato activo si la red lo
  // tiene definido. Al deselecccionar (click en la misma), restaura "todas las redes".
  const handleNetworkClick = (net: PublishOption) => {
    if (activeNetwork === net.key) {
      setActiveNetwork(null);
      return;
    }
    setActiveNetwork(net.key);
    if (net.format) setActiveFormat(net.format);
  };

  // Nombre saludo: profile.name > primer parte del email > fallback
  const greetingName = profile?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";
  const greeting = greetingName
    ? t("templates.greeting").replace("{name}", greetingName)
    : t("templates.greetingFallback");

  const visibleCats = showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 5);
  const totalCount = allTemplates.length;

  return (
    <div className="min-h-[calc(100vh-56px)]" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      {/* Drawer mobile overlay */}
      {showSidebarMobile && (
        <div onClick={() => setShowSidebarMobile(false)}
             className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      )}

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_240px] gap-3 lg:gap-4 px-3 sm:px-4 lg:px-5 py-3 sm:py-4">

        {/* ════════════════════════════════════════════════════════════════
            COLUMNA 1: SIDEBAR IZQUIERDA (drawer mobile / fija desktop)
        ════════════════════════════════════════════════════════════════ */}
        <aside className={`
          ${showSidebarMobile ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          fixed lg:sticky top-14 lg:top-[72px] left-0
          h-[calc(100vh-56px)] lg:h-[calc(100vh-90px)]
          w-72 lg:w-auto z-50 lg:z-auto
          overflow-y-auto scrollbar-hide
          transition-transform duration-300 ease-out
          rounded-2xl p-4 flex flex-col gap-5
        `} style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>

          {/* Navegacion */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest mb-2.5 uppercase"
                style={{ color: "var(--home-text-soft)" }}>{t("templates.nav.title")}</h3>
            <div className="space-y-0.5">
              {SIDEBAR_NAV.map(item => {
                const Icon = item.icon;
                const isActive = item.href === "/templates";
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowSidebarMobile(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={isActive ? {
                          background: "rgba(168,85,247,0.15)",
                          color: "var(--home-text)",
                          border: "1px solid rgba(168,85,247,0.3)",
                        } : { color: "var(--home-text-muted)" }}>
                    <Icon size={16} strokeWidth={2}
                          className={isActive ? "text-purple-400" : ""} />
                    {t(item.i18nKey)}
                    {isActive && <ChevronRight size={14} strokeWidth={2.5} className="ml-auto text-purple-400" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Filtros */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest mb-2.5 uppercase"
                style={{ color: "var(--home-text-soft)" }}>{t("templates.sidebar.filters")}</h3>
            <div className="relative">
              <Search size={14} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--home-text-soft)" }} />
              <input
                type="text"
                placeholder={t("home.search.placeholder")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs outline-none"
                style={{
                  background: "var(--home-card-bg)",
                  border: "1px solid var(--home-card-border)",
                  color: "var(--home-text)",
                }} />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1 rounded"
                   style={{ background: "var(--home-card-border)", color: "var(--home-text-muted)" }}>/</kbd>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <button onClick={() => setShowAllCategories(v => !v)}
                    className="w-full flex items-center justify-between mb-2.5">
              <h3 className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: "var(--home-text-soft)" }}>{t("templates.sidebar.categories")}</h3>
              <ChevronDown size={12} strokeWidth={2.5}
                           className={`transition-transform ${showAllCategories ? "rotate-180" : ""}`}
                           style={{ color: "var(--home-text-soft)" }} />
            </button>
            <div className="space-y-0.5">
              {visibleCats.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                const label = t(cat.i18nKey);
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} aria-label={label} aria-pressed={isActive}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={isActive ? {
                            background: "rgba(168,85,247,0.15)",
                            color: "var(--home-text)",
                            border: "1px solid rgba(168,85,247,0.3)",
                          } : { color: "var(--home-text-muted)" }}>
                    <Icon size={14} strokeWidth={2} className={isActive ? "text-purple-400" : ""} />
                    <span>{label}</span>
                  </button>
                );
              })}
              {!showAllCategories && CATEGORIES.length > 5 && (
                <button onClick={() => setShowAllCategories(true)}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 hover:text-purple-300">
                  <ChevronDown size={14} strokeWidth={2} />
                  {t("templates.cat.moreCategories")}
                </button>
              )}
            </div>
          </div>

          {/* Audiences */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: "var(--home-text-soft)" }}>{t("templates.sidebar.audience")}</h3>
              {activeAudiences.length > 0 && (
                <button onClick={() => setActiveAudiences([])}
                        className="text-[9px] text-purple-400 hover:text-purple-300">
                  {t("templates.sidebar.clear")}
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {AUDIENCES.map(aud => {
                const Icon = aud.icon;
                const isActive = activeAudiences.includes(aud.id);
                const label = t(aud.i18nKey);
                return (
                  <button key={aud.id} onClick={() => toggleAudience(aud.id)} aria-label={label} aria-pressed={isActive}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={isActive ? {
                            background: "rgba(168,85,247,0.15)",
                            color: "var(--home-text)",
                            border: "1px solid rgba(168,85,247,0.3)",
                          } : { color: "var(--home-text-muted)" }}>
                    <Icon size={14} strokeWidth={2} className={isActive ? "text-purple-400" : ""} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card promo PRO */}
          <div className="mt-auto rounded-xl p-3"
               style={{
                 background: "linear-gradient(135deg, rgba(250,204,21,0.12), rgba(245,158,11,0.08))",
                 border: "1px solid rgba(250,204,21,0.3)",
               }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Crown size={14} strokeWidth={2.2} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-amber-300">{t("templates.proCard.title")}</span>
            </div>
            <p className="text-[10px] leading-snug mb-2.5" style={{ color: "var(--home-text-muted)" }}>
              {t("templates.proCard.body")}
            </p>
            <button onClick={clearFilters}
                    className="w-full py-1.5 rounded-lg text-[11px] font-bold text-black transition-transform hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)" }}>
              {t("templates.proCard.cta")}
            </button>
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════════
            COLUMNA 2: MAIN CONTENT
        ════════════════════════════════════════════════════════════════ */}
        <div className="min-w-0 space-y-4">

          {/* HERO: saludo + CTA */}
          <section className="relative rounded-2xl overflow-hidden p-4 sm:p-5"
                   style={{
                     background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(124,58,237,0.04))",
                     border: "1px solid var(--home-card-border)",
                   }}>
            {/* Decoracion derecha — gradient blob estilo "neon disco" */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none opacity-70"
                 style={{
                   background: "radial-gradient(ellipse at 80% 50%, rgba(236,72,153,0.4), transparent 60%), radial-gradient(circle at 90% 30%, rgba(250,204,21,0.35), transparent 40%)",
                 }} />
            <div className="relative flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                  {greeting} <span className="inline-block">👋</span>
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--home-text-muted)" }}>
                  {t("templates.tagline")}
                </p>
              </div>
              <Link href="/create"
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-black transition-transform hover:scale-[1.03]"
                    style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)", boxShadow: "0 0 22px rgba(250,204,21,0.35)" }}>
                <Plus size={14} strokeWidth={2.5} />
                {t("templates.createFlyer")}
              </Link>
            </div>

            {/* BANNER PUBLICAR EN */}
            <div className="relative mt-4 rounded-xl p-3"
                 style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block shrink-0 max-w-[140px]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles size={11} strokeWidth={2.5} className="text-amber-400" />
                    <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--home-text)" }}>
                      {t("templates.publishIn")}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--home-text-soft)" }}>
                    {t("templates.publishIn.sub")}
                  </p>
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {PUBLISH_NETWORKS.map(net => (
                    <NetworkCard key={net.key} net={net}
                                 active={activeNetwork === net.key}
                                 label={t(net.i18nKey)}
                                 onClick={() => handleNetworkClick(net)} />
                  ))}
                  <CustomFormatCard label={t("templates.publish.custom")} sub={t("templates.publish.custom.sub")} />
                </div>
              </div>
            </div>
          </section>

          {/* SECCION: ¿PARA QUÉ LO NECESITAS? */}
          <section className="rounded-xl p-3"
                   style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="shrink-0 min-w-0">
                <div className="text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--home-text)" }}>
                  {t("templates.useCase.title")}
                </div>
                <div className="text-[10px]" style={{ color: "var(--home-text-soft)" }}>
                  {t("templates.useCase.sub")}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {USE_CASES.map(uc => {
                  const Icon = uc.icon;
                  const isActive = activeUseCase === uc.id;
                  return (
                    <button key={uc.id} onClick={() => setActiveUseCase(uc.id)}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all"
                            style={isActive ? {
                              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                              color: "#fff",
                              boxShadow: "0 0 12px rgba(168,85,247,0.3)",
                            } : {
                              background: "var(--home-card-bg)",
                              border: "1px solid var(--home-card-border)",
                              color: "var(--home-text-muted)",
                            }}>
                      <Icon size={12} strokeWidth={2} />
                      {t(uc.i18nKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* HEADER GRID: titulo + conteo + sort + view toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Boton Filtros mobile */}
              <button onClick={() => setShowSidebarMobile(true)}
                      className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: "var(--home-card-bg)",
                        border: "1px solid var(--home-card-border)",
                        color: "var(--home-text)",
                      }}>
                <LayoutGrid size={13} strokeWidth={2} />
                {t("templates.sidebar.filters")}
              </button>
              <h2 className="text-base sm:text-lg font-black inline-flex items-center gap-2">
                {t("templates.grid.title")}
                <Sparkles size={14} strokeWidth={2.4} className="text-amber-400" fill="currentColor" />
              </h2>
              <span className="text-xs" style={{ color: "var(--home-text-soft)" }}>
                +{t("templates.grid.count").replace("{n}", String(totalCount))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px]" style={{ color: "var(--home-text-soft)" }}>
                {t("templates.grid.sort")}:
              </span>
              <select className="rounded-lg px-2 py-1 text-xs outline-none"
                      style={{
                        background: "var(--home-card-bg)",
                        border: "1px solid var(--home-card-border)",
                        color: "var(--home-text)",
                      }}>
                <option>{t("templates.sort.recent")}</option>
                <option>{t("templates.sort.popular")}</option>
                <option>{t("templates.sort.premiumFirst")}</option>
              </select>
              {/* Toggle vista: cuadricula (cards) vs lista (filas) */}
              <div className="hidden sm:flex rounded-lg overflow-hidden"
                   style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Vista cuadricula"
                  className="w-7 h-7 flex items-center justify-center transition-colors"
                  style={viewMode === "grid"
                    ? { background: "rgba(168,85,247,0.15)", color: "#a855f7" }
                    : { color: "var(--home-text-soft)" }
                  }>
                  <LayoutGrid size={13} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="Vista lista"
                  className="w-7 h-7 flex items-center justify-center transition-colors"
                  style={viewMode === "list"
                    ? { background: "rgba(168,85,247,0.15)", color: "#a855f7" }
                    : { color: "var(--home-text-soft)" }
                  }>
                  <List size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* GRID DE PLANTILLAS */}
          {filtered.length === 0 ? (
            <div className="rounded-xl py-16 text-center text-xs"
                 style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text-muted)" }}>
              <p className="font-semibold mb-1">{t("templates.empty.title")}</p>
              <p>{t("templates.empty.sub")}</p>
              <button onClick={clearFilters} className="mt-3 text-purple-400 text-xs hover:text-purple-300 font-semibold">
                {t("templates.empty.cta")}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleTemplates.map(tpl => (
                <TemplateCard key={`${tpl.id}-${activeFormat}`}
                              template={tpl}
                              formatId={activeFormat}
                              aspect={FORMAT_ASPECT[activeFormat]}
                              isFavorite={favorites.has(tpl.id)}
                              onToggleFavorite={() => toggleFavorite(tpl.id)}
                              onUse={() => handleUseTemplate(tpl)} />
              ))}
            </div>
          ) : (
            /* Vista LISTA: 1 fila por plantilla. Thumb pequeño izquierda,
               info al lado, favorito + CTA "Usar plantilla" a la derecha. */
            <div className="flex flex-col gap-2">
              {visibleTemplates.map(tpl => (
                <TemplateRow key={`${tpl.id}-${activeFormat}`}
                             template={tpl}
                             formatId={activeFormat}
                             aspect={FORMAT_ASPECT[activeFormat]}
                             isFavorite={favorites.has(tpl.id)}
                             onToggleFavorite={() => toggleFavorite(tpl.id)}
                             onUse={() => handleUseTemplate(tpl)} />
              ))}
            </div>
          )}

          {/* CARGAR MAS */}
          {hasMore && (
            <div className="flex justify-center pt-3">
              <button onClick={() => setVisibleCount(c => c + 10)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                      style={{
                        background: "var(--home-card-bg)",
                        border: "1px solid var(--home-card-border)",
                        color: "var(--home-text)",
                      }}>
                <ChevronDown size={14} strokeWidth={2} />
                {t("templates.grid.loadMore")}
              </button>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLUMNA 3: RIGHT RAIL (acciones rapidas + promo IA)
        ════════════════════════════════════════════════════════════════ */}
        <aside className="hidden xl:block space-y-3">
          {/* Quick actions */}
          <div className="sticky top-[72px] space-y-3">
            <div className="rounded-2xl p-3"
                 style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                  <Sparkles size={13} strokeWidth={2} className="text-purple-400" />
                </div>
                <h3 className="text-xs font-black">{t("templates.quickActions.title")}</h3>
              </div>
              <div className="space-y-0.5">
                <QuickAction icon={Maximize2} label={t("templates.quickActions.customSize")} />
                <QuickAction icon={Upload}    label={t("templates.quickActions.uploadImage")} />
                <QuickAction icon={FolderOpen} label={t("templates.quickActions.myResources")} href="/projects" />
                <QuickAction icon={Palette}   label={t("templates.quickActions.myColors")} />
                <QuickAction icon={Type}      label={t("templates.quickActions.myFonts")} />
              </div>
            </div>

            {/* Card promo IA */}
            <div className="rounded-2xl p-3 relative overflow-hidden"
                 style={{
                   background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.08))",
                   border: "1px solid rgba(168,85,247,0.3)",
                 }}>
              <span className="text-[9px] font-black tracking-widest uppercase text-purple-300">
                {t("templates.aiCard.tag")}
              </span>
              <h3 className="text-sm font-black mt-1 mb-1">{t("templates.aiCard.title")}</h3>
              <p className="text-[10px] leading-snug mb-2.5" style={{ color: "var(--home-text-muted)" }}>
                {t("templates.aiCard.body")}
              </p>
              <Link href="/create"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-purple-200">
                <Sparkles size={11} strokeWidth={2.5} />
                {t("templates.createFlyer")}
              </Link>
              {/* Bot emoji decorativo */}
              <div className="absolute -bottom-2 -right-2 text-3xl opacity-60 pointer-events-none">🤖</div>
            </div>
          </div>
        </aside>
      </div>

      {modalTemplate && (
        <FormatPickerModal template={modalTemplate} onClose={() => setModalTemplate(null)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTES
// ════════════════════════════════════════════════════════════════════════════

/** Card de red social en el banner "PUBLICAR EN". */
function NetworkCard({
  net, active, label, onClick,
}: { net: PublishOption; active: boolean; label: string; onClick: () => void }) {
  const Icon = net.Icon;
  return (
    <button onClick={onClick}
            className="shrink-0 rounded-xl px-2.5 py-1.5 flex items-center gap-2 transition-all"
            style={active ? {
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              border: "1px solid rgba(168,85,247,0.5)",
              boxShadow: "0 0 12px rgba(168,85,247,0.3)",
            } : {
              background: "var(--home-card-bg)",
              border: "1px solid var(--home-card-border)",
            }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: net.brandColor, color: "#fff" }}>
        <Icon size={14} />
      </div>
      <div className="text-left min-w-0">
        <div className="text-[11px] font-bold leading-tight truncate" style={{ color: active ? "#fff" : "var(--home-text)" }}>
          {label}
        </div>
        <div className="text-[9px] leading-tight" style={{ color: active ? "rgba(255,255,255,0.8)" : "var(--home-text-soft)" }}>
          {net.ratio}
        </div>
      </div>
    </button>
  );
}

/** Card "Formato personalizado" — variante del banner. */
function CustomFormatCard({ label, sub }: { label: string; sub: string }) {
  return (
    <button className="shrink-0 rounded-xl px-2.5 py-1.5 flex items-center gap-2 transition-all border-dashed"
            style={{
              background: "var(--home-card-bg)",
              border: "1.5px dashed var(--home-card-border)",
            }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
        <Maximize2 size={13} strokeWidth={2} style={{ color: "var(--home-text-muted)" }} />
      </div>
      <div className="text-left min-w-0">
        <div className="text-[11px] font-bold leading-tight truncate" style={{ color: "var(--home-text)" }}>
          {label}
        </div>
        <div className="text-[9px] leading-tight" style={{ color: "var(--home-text-soft)" }}>
          {sub}
        </div>
      </div>
    </button>
  );
}

/** Acción rápida en el panel lateral derecho. */
function QuickAction({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href?: string }) {
  const className = "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors hover:opacity-80";
  const style = { color: "var(--home-text-muted)" };
  const content = (
    <>
      <Icon size={14} strokeWidth={2} className="text-purple-400" />
      <span>{label}</span>
    </>
  );
  if (href) return <Link href={href} className={className} style={style}>{content}</Link>;
  return <button className={className} style={style}>{content}</button>;
}

/** Card de plantilla — replica el mockup: tag arriba izq, PRO arriba dcha,
 *  heart hover, imagen full, title + meta debajo, more menu. */
function TemplateCard({
  template, formatId, aspect, isFavorite, onToggleFavorite, onUse,
}: {
  template: Template;
  formatId: FormatId;
  aspect: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onUse: () => void;
}) {
  const { t } = useLocale();

  // Meta debajo del titulo: "Post · Instagram (4:5)" — derivado del formato
  const formatMetaMap: Record<FormatId, string> = {
    "portrait":     "Post · Instagram (4:5)",
    "square":       "Post · Instagram (1:1)",
    "story":        "Story · Reel (9:16)",
    "fb-cover":     "Banner · Facebook (16:9)",
    "print":        "Impresión",
    "flyer-legacy": "Flyer",
  };

  return (
    <article className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
             style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
      <div className="relative overflow-hidden cursor-pointer" style={{ aspectRatio: aspect }} onClick={onUse}>
        <TemplateFabricThumbnail template={template} formatId={formatId}
                                 className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.04]" />

        {/* Tag categoria arriba izquierda */}
        <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-black/65 text-white backdrop-blur-sm border border-white/15">
          {template.category}
        </span>

        {/* Badge PRO arriba derecha */}
        {template.premium && (
          <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-0.5 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md text-black"
                style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)" }}>
            <Crown size={9} strokeWidth={2.5} fill="currentColor" />
            PRO
          </span>
        )}

        {/* Heart favorito — visible siempre si esta activo, hover en otros */}
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                aria-label="favorite"
                className={`absolute z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all
                  ${isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                  ${template.premium ? "top-7 right-1.5" : "top-1.5 right-1.5"}`}
                style={{ background: "rgba(0,0,0,0.55)" }}>
          <Heart size={12} strokeWidth={2}
                 className={isFavorite ? "text-pink-400" : "text-white"}
                 fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info block */}
      <div className="p-2 sm:p-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-bold truncate" style={{ color: "var(--home-text)" }}>
            {template.title}
          </h3>
          <p className="text-[10px] truncate" style={{ color: "var(--home-text-soft)" }}>
            {formatMetaMap[formatId]}
          </p>
        </div>
        <button aria-label="more"
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:opacity-80"
                style={{ color: "var(--home-text-soft)" }}>
          <MoreVertical size={13} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}

/** Vista LISTA — 1 fila por plantilla. Thumb pequeño + info + acciones.
 *  Pensada para escaneo rapido cuando el user quiere ver muchas plantillas
 *  con sus titulos completos (sin truncar como en grid). */
function TemplateRow({
  template, formatId, aspect, isFavorite, onToggleFavorite, onUse,
}: {
  template: Template;
  formatId: FormatId;
  aspect: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onUse: () => void;
}) {
  const { t } = useLocale();

  const formatMetaMap: Record<FormatId, string> = {
    "portrait":     "Post · Instagram (4:5)",
    "square":       "Post · Instagram (1:1)",
    "story":        "Story · Reel (9:16)",
    "fb-cover":     "Banner · Facebook (16:9)",
    "print":        "Impresión",
    "flyer-legacy": "Flyer",
  };

  return (
    <article
      className="group flex items-stretch gap-3 rounded-xl overflow-hidden transition-all hover:scale-[1.005]"
      style={{
        background: "var(--home-bg-soft)",
        border: "1px solid var(--home-card-border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {/* Thumb compacto izquierda. Aspect ratio igual que en grid para
          coherencia visual; el ancho lo fijamos con w-16 (mobile) o w-20 (sm+). */}
      <div
        className="relative shrink-0 w-16 sm:w-20 cursor-pointer overflow-hidden"
        style={{ aspectRatio: aspect }}
        onClick={onUse}
      >
        <TemplateFabricThumbnail template={template} formatId={formatId}
                                 className="absolute inset-0 h-full w-full" />
        {template.premium && (
          <span className="absolute top-1 right-1 inline-flex items-center text-[8px] font-black px-1 py-0.5 rounded text-black"
                style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)" }}>
            <Crown size={8} strokeWidth={2.5} fill="currentColor" />
          </span>
        )}
      </div>

      {/* Info central — categoria + titulo + meta. Ocupa el espacio
          restante. cursor-pointer para que al clickar abra la plantilla. */}
      <button
        onClick={onUse}
        className="flex-1 min-w-0 flex flex-col justify-center text-left py-2 pr-1"
      >
        <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mb-0.5"
              style={{ color: "var(--home-text-soft)" }}>
          {template.category}
        </span>
        <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: "var(--home-text)" }}>
          {template.title}
        </h3>
        <p className="text-[10px] sm:text-xs truncate" style={{ color: "var(--home-text-muted)" }}>
          {formatMetaMap[formatId]}
        </p>
      </button>

      {/* Acciones derecha — favorito + Usar plantilla. */}
      <div className="shrink-0 flex items-center gap-1.5 pr-2 sm:pr-3 py-2">
        <button
          onClick={onToggleFavorite}
          aria-label="favorite"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}
        >
          <Heart
            size={13}
            strokeWidth={2}
            className={isFavorite ? "text-pink-400" : ""}
            style={!isFavorite ? { color: "var(--home-text-muted)" } : {}}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
        <button
          onClick={onUse}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-transform hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 12px rgba(168,85,247,0.3)" }}
        >
          {t("templates.use")}
        </button>
      </div>
    </article>
  );
}

