"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Palette, Pencil, Trash2, Plus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import type { Project } from "@/lib/supabase";

// Mapea Locale (es/en/fr/pt) a BCP47 para Intl.DateTimeFormat. Si añades
// nuevos idiomas, completar aqui.
const LOCALE_TO_BCP47: Record<string, string> = {
    es: "es-ES",
    en: "en-US",
    fr: "fr-FR",
    pt: "pt-PT",
};

export default function ProjectsPage() {
    const { loadProjects, deleteProject, loading } = useProjects();
    const { user } = useAuth();
    const { t, locale } = useLocale();
    const [projects, setProjects] = useState<Project[]>([]);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadProjects().then(setProjects);
    }, [user, loadProjects]);

    const handleDelete = async (id: string) => {
        if (!confirm(t("projects.confirmDelete"))) return;
        setDeleting(id);
        const ok = await deleteProject(id);
        if (ok) setProjects(p => p.filter(x => x.id !== id));
        setDeleting(null);
    };

    if (!user) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Lock size={28} strokeWidth={1.8} />
            </div>
            <h2 className="text-2xl font-black mb-2">{t("projects.loginRequired.title")}</h2>
            <p className="text-gray-400 mb-6">{t("projects.loginRequired.body")}</p>
            <Link href="/" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">{t("projects.loginRequired.cta")}</Link>
        </div>
    );

    // Pluralizacion segun el conteo: subtitle.one cuando es 1, subtitle.many cuando 0/2+
    // {n} en el dict se sustituye por el numero real.
    const subtitleKey = projects.length === 1 ? "projects.subtitle.one" : "projects.subtitle.many";
    const subtitle = t(subtitleKey).replace("{n}", String(projects.length));

    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-8 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: "var(--home-text)" }}>{t("projects.title")}</h1>
                    <p className="text-gray-400 text-xs sm:text-sm">{subtitle}</p>
                </div>
                <Link href="/templates" className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all hover:scale-105 w-full sm:w-auto">
                    <Plus size={16} strokeWidth={2.4} />
                    {t("projects.newFlyer")}
                </Link>
            </div>

            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />)}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                    <div className="w-20 h-20 mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <Palette size={36} strokeWidth={1.6} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{t("projects.empty.title")}</h3>
                    <p className="text-gray-400 text-sm mb-6">{t("projects.empty.body")}</p>
                    <Link href="/templates" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">{t("projects.empty.cta")}</Link>
                </div>
            )}

            {!loading && projects.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {projects.map(project => (
                        <div key={project.id} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-purple-500/30 transition-all">
                            <Link href={`/editor/${project.id}`} className="block">
                                <div className="aspect-[3/4] bg-gradient-to-br from-purple-900/40 to-pink-900/20 flex items-center justify-center overflow-hidden">
                                    {project.thumbnail_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <Palette size={40} strokeWidth={1.4} className="text-purple-300/60" />
                                    )}
                                </div>
                                <div className="p-2 sm:p-3">
                                    <h3 className="font-bold text-xs sm:text-sm truncate" style={{ color: "var(--home-text)" }}>{project.title}</h3>
                                    <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                                        {new Date(project.updated_at).toLocaleDateString(LOCALE_TO_BCP47[locale] ?? "es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                            </Link>
                            {/* Boton eliminar - SIEMPRE visible en mobile, hover en desktop */}
                            <button
                                onClick={() => handleDelete(project.id)}
                                disabled={deleting === project.id}
                                aria-label={t("projects.card.deleteAria")}
                                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 backdrop-blur text-red-400 hover:bg-red-900/80 hover:text-red-300 transition-all flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50"
                            >
                                {deleting === project.id ? (
                                    <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                    <Trash2 size={14} strokeWidth={1.8} />
                                )}
                            </button>
                            {/* Overlay edit - SOLO DESKTOP en hover */}
                            <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-3 pointer-events-none">
                                <Link href={`/editor/${project.id}`} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold pointer-events-auto">
                                    <Pencil size={14} strokeWidth={2} />
                                    {t("projects.card.edit")}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
