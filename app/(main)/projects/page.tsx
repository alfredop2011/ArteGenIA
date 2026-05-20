"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/lib/supabase";

export default function ProjectsPage() {
    const { loadProjects, deleteProject, loading } = useProjects();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadProjects().then(setProjects);
    }, [user, loadProjects]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este proyecto?")) return;
        setDeleting(id);
        const ok = await deleteProject(id);
        if (ok) setProjects(p => p.filter(x => x.id !== id));
        setDeleting(null);
    };

    if (!user) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-black mb-2">Inicia sesión para ver tus flyers</h2>
            <p className="text-gray-400 mb-6">Guarda y accede a todos tus diseños desde cualquier dispositivo.</p>
            <Link href="/" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">Ir al inicio</Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white mb-1">Mis flyers</h1>
                    <p className="text-gray-400 text-sm">{projects.length} proyecto{projects.length !== 1 ? "s" : ""} guardado{projects.length !== 1 ? "s" : ""}</p>
                </div>
                <Link href="/templates" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all hover:scale-105">
                    + Nuevo flyer
                </Link>
            </div>

            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />)}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-bold mb-2">Aún no tienes flyers guardados</h3>
                    <p className="text-gray-400 mb-6">Crea tu primer flyer y guárdalo para acceder desde cualquier dispositivo.</p>
                    <Link href="/templates" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">Explorar plantillas</Link>
                </div>
            )}

            {!loading && projects.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {projects.map(project => (
                        <div key={project.id} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-purple-500/30 transition-all">
                            <div className="aspect-[3/4] bg-gradient-to-br from-purple-900/40 to-pink-900/20 flex items-center justify-center overflow-hidden">
                                {project.thumbnail_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">🎨</span>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="text-white font-bold text-sm truncate">{project.title}</h3>
                                <p className="text-gray-500 text-xs mt-0.5">
                                    {new Date(project.updated_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                <Link href={`/editor/${project.id}`} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold">✏️ Editar</Link>
                                <button onClick={() => handleDelete(project.id)} disabled={deleting === project.id}
                                    className="px-5 py-2 rounded-xl bg-red-900/60 hover:bg-red-900 text-red-400 text-sm font-bold disabled:opacity-50">
                                    {deleting === project.id ? "Eliminando..." : "🗑️ Eliminar"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
