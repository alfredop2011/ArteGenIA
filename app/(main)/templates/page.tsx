"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Search,
  PartyPopper,
  Mic2,
  Star,
  Footprints,
  SlidersHorizontal,
  BriefcaseBusiness,
  GraduationCap,
  Clapperboard,
  Palette,
  Landmark,
  Megaphone,
  School,
  Crown,
  Check,
  Trash2,
  SearchX,
  Copy,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { templates, type Template, type AudienceId } from "@/data/templates";
import { type FormatId } from "@/data/formats";
import TemplateFabricThumbnail from "@/components/templates/TemplateFabricThumbnail";
import FormatPickerModal from "@/components/templates/FormatPickerModal";
import FormatDestinationPicker from "@/components/templates/FormatDestinationPicker";

type CategoryItem = { id: string; label: string; icon: LucideIcon };
type AudienceItem = { id: AudienceId; label: string; icon: LucideIcon };

const CATEGORIES: CategoryItem[] = [
    { id: "todas", label: "Todas", icon: LayoutGrid },
    { id: "fiesta", label: "Fiesta", icon: PartyPopper },
    { id: "concierto", label: "Conciertos", icon: Mic2 },
    { id: "festival", label: "Festival", icon: Star },
    { id: "clases", label: "Clases de baile", icon: Footprints },
    { id: "discoteca", label: "Club / Discoteca", icon: SlidersHorizontal },
    { id: "gala", label: "Corporativo", icon: BriefcaseBusiness },
];

const AUDIENCES: AudienceItem[] = [
    { id: "academias",     label: "Academias",     icon: GraduationCap },
    { id: "productoras",   label: "Productoras",   icon: Clapperboard },
    { id: "freelance",     label: "Freelance",     icon: Palette },
    { id: "instituciones", label: "Instituciones", icon: Landmark },
    { id: "agencias",      label: "Agencias",      icon: Megaphone },
    { id: "colegios",      label: "Colegios",      icon: School },
];

const TOP_FILTERS = ["Todas", "Festival"];

// Ratios CSS para que las cards adapten su altura según el formato activo
const FORMAT_ASPECT: Record<FormatId, string> = {
    "square":       "1 / 1",
    "portrait":     "4 / 5",
    "story":        "9 / 16",
    "print":        "1240 / 1748",
    "fb-cover":     "1920 / 1005",
    "flyer-legacy": "430 / 540",
};

export default function TemplatesPage() {
    const router = useRouter();
    const [activeFormat, setActiveFormat] = useState<FormatId>("portrait");
    const [activeCategory, setActiveCategory] = useState("todas");
    const [activeAudiences, setActiveAudiences] = useState<AudienceId[]>([]);
    const [activeTopFilter, setActiveTopFilter] = useState("Todas");
    const [searchQuery, setSearchQuery] = useState("");
    const [modalTemplate, setModalTemplate] = useState<Template | null>(null);
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);

    const toggleAudience = (id: AudienceId) => {
        setActiveAudiences(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleUseTemplate = (template: Template) => {
        // Si la plantilla tiene la variante del formato activo, ir directo a ella
        const directVariant = template.variants.find(v => v.format === activeFormat);
        if (directVariant) {
            router.push(`/editor/${template.id}?format=${activeFormat}`);
            return;
        }
        // Si solo hay 1 variante saltamos el modal y abrimos directamente
        if (template.variants.length <= 1) {
            const fmt = template.variants[0]?.format;
            router.push(fmt ? `/editor/${template.id}?format=${fmt}` : `/editor/${template.id}`);
            return;
        }
        // Más de 1 variante: pedir al usuario que elija
        setModalTemplate(template);
    };

    // Contadores por formato (cuántas plantillas tienen cada variante)
    const formatCounts = useMemo<Record<"square" | "story" | "portrait" | "fb-cover", number>>(() => ({
        "square":   templates.filter(t => t.variants.some(v => v.format === "square")).length,
        "story":    templates.filter(t => t.variants.some(v => v.format === "story")).length,
        "portrait": templates.filter(t => t.variants.some(v => v.format === "portrait")).length,
        "fb-cover": templates.filter(t => t.variants.some(v => v.format === "fb-cover")).length,
    }), []);

    const filtered = useMemo(() => {
        return templates.filter((t) => {
            // Filtrado estricto por formato activo
            const matchFormat = t.variants.some(v => v.format === activeFormat);
            if (!matchFormat) return false;

            const cat = t.category.toLowerCase();
            const matchCat = activeCategory === "todas"
                || cat === activeCategory
                || cat.includes(activeCategory)
                || activeCategory.includes(cat.split(" ")[0])
                || (activeCategory === "gala" && cat.includes("corporativo"))
                || (activeCategory === "discoteca" && cat.includes("club"));

            // Audiencias: AND lógico — la plantilla debe servir a TODAS las activas
            const matchAudience = activeAudiences.length === 0 ||
                activeAudiences.every(a => t.audience.includes(a));

            const matchSearch = searchQuery === "" ||
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchTop = activeTopFilter === "Todas" ||
                (activeTopFilter === "Premium" && t.premium) ||
                cat.includes(activeTopFilter.toLowerCase());
            return matchCat && matchAudience && matchSearch && matchTop;
        });
    }, [activeFormat, activeCategory, activeAudiences, searchQuery, activeTopFilter]);

    const clearFilters = () => {
        setActiveFormat("portrait");
        setActiveCategory("todas");
        setActiveAudiences([]);
        setActiveTopFilter("Todas");
        setSearchQuery("");
    };

    return (
        <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]">
            {/* Overlay sidebar mobile */}
            {showSidebarMobile && (
                <div
                    onClick={() => setShowSidebarMobile(false)}
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                />
            )}

            {/* Sidebar - DESKTOP: fijo lateral. MOBILE: drawer deslizable desde izq */}
            <aside className={`
                ${showSidebarMobile ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
                fixed md:static inset-y-0 left-0 top-14 md:top-0
                z-50 md:z-auto
                w-72 md:w-64 shrink-0
                border-r border-white/[0.06] bg-[#0c0c12]
                overflow-y-auto p-4 flex flex-col gap-5
                transition-transform duration-300 ease-out
            `}>
                <div className="flex items-center justify-between md:block">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Filtros</h3>
                    {/* Boton cerrar drawer SOLO MOBILE */}
                    <button onClick={() => setShowSidebarMobile(false)} className="md:hidden text-gray-400 active:text-white mb-3">
                        <span className="text-xl leading-none">×</span>
                    </button>
                </div>
                <div>
                    <div className="relative">
                        <Search size={16} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar plantillas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Categorías</h3>
                    <div className="space-y-0.5">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    aria-label={cat.label}
                                    aria-pressed={isActive}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                        isActive
                                            ? "bg-purple-600/20 text-white border border-purple-500/30"
                                            : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={1.8}
                                        className={`shrink-0 ${isActive ? "text-yellow-400" : ""}`}
                                    />
                                    <span>{cat.label}</span>
                                    {isActive && (
                                        <Check size={15} strokeWidth={2} className="ml-auto text-purple-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="flex items-baseline justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Para quién es</h3>
                        {activeAudiences.length > 0 && (
                            <button
                                onClick={() => setActiveAudiences([])}
                                className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        {AUDIENCES.map((aud) => {
                            const Icon = aud.icon;
                            const isActive = activeAudiences.includes(aud.id);
                            return (
                                <button
                                    key={aud.id}
                                    onClick={() => toggleAudience(aud.id)}
                                    aria-label={aud.label}
                                    aria-pressed={isActive}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                        isActive
                                            ? "bg-purple-600/20 text-white border border-purple-500/30"
                                            : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                                    }`}
                                >
                                    <Icon
                                        size={16}
                                        strokeWidth={1.8}
                                        className={`shrink-0 ${isActive ? "text-yellow-400" : ""}`}
                                    />
                                    <span>{aud.label}</span>
                                    {isActive && (
                                        <Check size={13} strokeWidth={2.4} className="ml-auto text-purple-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={clearFilters}
                    aria-label="Borrar todos los filtros"
                    className="mt-auto flex items-center gap-2 justify-center w-full border border-white/10 rounded-xl py-2.5 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                    <Trash2 size={16} strokeWidth={1.8} />
                    Borrar filtros
                </button>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3 sm:p-6">
                    <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-white">Plantillas</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                                {activeCategory === "todas"
                                    ? "Elige una plantilla lista para editar"
                                    : `Explorando: ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Boton Filtros - SOLO MOBILE */}
                            <button
                                onClick={() => setShowSidebarMobile(true)}
                                className="md:hidden flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-medium text-gray-300 active:bg-white/10"
                            >
                                <SlidersHorizontal size={14} strokeWidth={2} />
                                Filtros
                            </button>
                            <select className="hidden sm:block bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-300 outline-none">
                                <option className="bg-[#1a1a2e]">Más recientes</option>
                                <option className="bg-[#1a1a2e]">Más populares</option>
                                <option className="bg-[#1a1a2e]">Premium primero</option>
                            </select>
                        </div>
                    </div>

                    {/* ─── Selector de formato premium con parallax ─── */}
                    <FormatDestinationPicker
                        selectedFormat={activeFormat as "square" | "story" | "portrait" | "fb-cover"}
                        onFormatChange={(id) => setActiveFormat(id)}
                        counts={formatCounts}
                    />

                    {/* Filtros rápidos */}
                    <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                        {TOP_FILTERS.map((filter) => {
                            const isActive = activeTopFilter === filter;
                            const isPremium = filter === "Premium";
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setActiveTopFilter(filter)}
                                    aria-pressed={isActive}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        isActive
                                            ? "bg-purple-600 text-white"
                                            : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                    }`}
                                >
                                    {isPremium && <Crown size={14} strokeWidth={1.8} />}
                                    {filter}
                                </button>
                            );
                        })}
                    </div>

                    {/* Grid - 2 cols mobile, 2 sm, 3 lg, 4 xl */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                            <SearchX size={40} strokeWidth={1.5} className="mb-4 text-gray-700" />
                            <p className="text-lg font-medium">No hay plantillas en este formato todavía</p>
                            <p className="text-sm mt-1">Prueba con otro formato o quita algún filtro</p>
                            <button onClick={clearFilters} className="mt-4 text-purple-400 text-sm hover:text-purple-300">
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((template) => (
                                <article
                                    key={`${template.id}-${activeFormat}`}
                                    className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:border-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-900/20 hover:-translate-y-1 duration-300"
                                >
                                    <div
                                        className="relative overflow-hidden"
                                        style={{ aspectRatio: FORMAT_ASPECT[activeFormat] }}
                                    >
                                        <TemplateFabricThumbnail
                                            template={template}
                                            formatId={activeFormat}
                                            className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.02]"
                                        />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                        <span className="absolute left-3 top-3 rounded-full bg-black/60 border border-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                            {template.category}
                                        </span>

                                        {template.premium && (
                                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
                                                <Crown size={11} strokeWidth={2.2} />
                                                PRO
                                            </span>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h2 className="text-base font-bold text-white leading-tight">{template.title}</h2>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <button
                                            onClick={() => handleUseTemplate(template)}
                                            className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 hover:border-purple-600 transition-all"
                                            aria-label={`Usar plantilla ${template.title}`}
                                        >
                                            <Copy size={15} strokeWidth={1.8} />
                                            Usar plantilla
                                            <Sparkles size={13} strokeWidth={1.8} className="ml-0.5 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalTemplate && (
                <FormatPickerModal
                    template={modalTemplate}
                    onClose={() => setModalTemplate(null)}
                />
            )}
        </div>
    );
}
