"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { templates } from "@/data/templates";
import TemplateFabricThumbnail from "@/components/templates/TemplateFabricThumbnail";

const CATEGORIES = [
    { id: "todas", label: "Todas", icon: "⊞" },
    { id: "fiesta", label: "Fiesta / Club", icon: "🎉" },
    { id: "concierto", label: "Conciertos", icon: "🎤" },
    { id: "festival", label: "Festival", icon: "⭐" },
    { id: "salsa", label: "Salsa", icon: "💃" },
    { id: "bachata", label: "Bachata", icon: "🌹" },
    { id: "urbano", label: "Urbano", icon: "🎧" },
    { id: "discoteca", label: "Club / Discoteca", icon: "🎹" },
    { id: "gala", label: "Corporativo", icon: "💼" },
];

const TOP_FILTERS = ["Todas", "1 artista", "2 artistas", "5 artistas", "10 artistas", "Premium 👑", "Salsa", "Festival"];

const COLORS = ["#7c3aed", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6b7280", "#000000"];

const STYLES = ["Todos los estilos", "Neón", "Dorado Premium", "Minimalista", "Tropical", "Urbano"];

export default function TemplatesPage() {
    const [activeCategory, setActiveCategory] = useState("todas");
    const [activeTopFilter, setActiveTopFilter] = useState("Todas");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeColor, setActiveColor] = useState<string | null>(null);
    const [activeStyle, setActiveStyle] = useState("Todos los estilos");

    const filtered = useMemo(() => {
        return templates.filter((t) => {
            const cat = t.category.toLowerCase();
            const matchCat = activeCategory === "todas" || cat === activeCategory;
            const matchSearch = searchQuery === "" ||
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchTop = activeTopFilter === "Todas" ||
                (activeTopFilter === "Premium 👑" && t.premium) ||
                cat.includes(activeTopFilter.toLowerCase());
            return matchCat && matchSearch && matchTop;
        });
    }, [activeCategory, searchQuery, activeTopFilter]);

    const clearFilters = () => {
        setActiveCategory("todas");
        setActiveTopFilter("Todas");
        setSearchQuery("");
        setActiveColor(null);
        setActiveStyle("Todos los estilos");
    };

    return (
        <div className="flex h-[calc(100vh-56px)]">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0c0c12] overflow-y-auto p-4 flex flex-col gap-5">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Filtros</h3>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
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
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                    activeCategory === cat.id
                                        ? "bg-purple-600/20 text-white border border-purple-500/30"
                                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                }`}
                            >
                                <span className="text-base">{cat.icon}</span>
                                <span>{cat.label}</span>
                                {activeCategory === cat.id && (
                                    <span className="ml-auto text-purple-400">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Estilos</h3>
                    <select
                        value={activeStyle}
                        onChange={(e) => setActiveStyle(e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-300 outline-none"
                    >
                        {STYLES.map((s) => (
                            <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Colores</h3>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setActiveColor(activeColor === color ? null : color)}
                                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                                    activeColor === color ? "ring-2 ring-white ring-offset-1 ring-offset-[#0c0c12]" : ""
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={clearFilters}
                    className="mt-auto flex items-center gap-2 justify-center w-full border border-white/10 rounded-xl py-2.5 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                    <span>🗑</span> Borrar filtros
                </button>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Plantillas</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeCategory === "todas"
                                    ? "Elige una plantilla lista para editar"
                                    : `Explorando: ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
                            </p>
                        </div>
                        <select className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-300 outline-none">
                            <option className="bg-[#1a1a2e]">Más recientes</option>
                            <option className="bg-[#1a1a2e]">Más populares</option>
                            <option className="bg-[#1a1a2e]">Premium primero</option>
                        </select>
                    </div>

                    {/* Filtros rápidos */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {TOP_FILTERS.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveTopFilter(filter)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    activeTopFilter === filter
                                        ? "bg-purple-600 text-white"
                                        : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                            <span className="text-4xl mb-4">🔍</span>
                            <p className="text-lg font-medium">No se encontraron plantillas</p>
                            <p className="text-sm mt-1">Prueba con otros filtros</p>
                            <button onClick={clearFilters} className="mt-4 text-purple-400 text-sm hover:text-purple-300">
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((template) => (
                                <article
                                    key={template.id}
                                    className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-purple-900/20"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden">
                                        <TemplateFabricThumbnail
                                            template={template}
                                            className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.02]"
                                        />
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                        <span className="absolute left-3 top-3 rounded-full bg-black/60 border border-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                            {template.category}
                                        </span>

                                        {template.premium && (
                                            <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-black">
                                                PRO
                                            </span>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h2 className="text-base font-bold text-white leading-tight">{template.title}</h2>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <Link
                                            href={`/editor/${template.id}`}
                                            className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 hover:border-purple-600 transition-all"
                                        >
                                            <span className="text-xs">✦</span> Usar plantilla
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
