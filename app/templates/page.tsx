import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { templates } from "@/data/templates";

const CATEGORIES = ["Todo", "Fiesta", "Concierto", "Discoteca", "Gala", "Salsa", "Festival", "Bachata", "Urbano"];

export default function TemplatesPage() {
    return (
        <AppShell>
            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="mb-2 text-sm font-medium text-purple-300">ArteGenIA</p>
                        <h1 className="text-3xl font-bold md:text-5xl">Plantillas editables</h1>
                        <p className="mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
                            Elige una plantilla, cambia textos, sube la foto del artista y exporta tu flyer.
                        </p>
                    </div>
                    <Link
                        href="/create"
                        className="rounded-xl bg-purple-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-purple-500"
                    >
                        Generar con IA
                    </Link>
                </div>

                {/* Filtros */}
                <div className="mb-8 flex flex-wrap gap-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-purple-600 hover:border-purple-600 hover:text-white transition-colors"
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid de plantillas */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {templates.map((template) => (
                        <article
                            key={template.id}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl transition-transform hover:scale-[1.02]"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <img
                                    src={template.image}
                                    alt={template.title}
                                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                                />
                                {/* Overlay oscuro */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {/* Badge categoría */}
                                <span className="absolute left-3 top-3 rounded-full bg-black/60 border border-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                    {template.category}
                                </span>

                                {/* Badge PRO */}
                                {template.premium && (
                                    <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                                        PRO
                                    </span>
                                )}

                                {/* Título sobre imagen */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h2 className="text-lg font-bold text-white">{template.title}</h2>
                                </div>
                            </div>

                            <div className="p-4">
                                <Link
                                    href={`/editor/${template.id}`}
                                    className="block w-full rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-black hover:bg-gray-200 transition-colors"
                                >
                                    Usar plantilla
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </AppShell>
    );
}