import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import FlyerCanvas from "@/components/editor/FlyerCanvas";
import { templates } from "@/data/templates";

type EditorPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditorPage({ params }: EditorPageProps) {
    const { id } = await params;
    const template = templates.find((item) => item.id === Number(id));

    if (!template) {
        return (
            <AppShell>
                <section className="mx-auto max-w-7xl px-6 py-8">
                    <h1 className="text-3xl font-bold">Plantilla no encontrada</h1>

                    <p className="mt-2 text-gray-400">
                        La plantilla que intentas editar no existe.
                    </p>

                    <Link
                        href="/templates"
                        className="mt-6 inline-block rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
                    >
                        Volver a plantillas
                    </Link>
                </section>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <section className="grid min-h-[calc(100vh-73px)] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_1fr_320px]">
                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold">Herramientas</h2>

                    <div className="mt-5 space-y-3">
                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Texto
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Subir artista
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Quitar fondo
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Cambiar fondo
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Añadir logo
                        </button>
                    </div>
                </aside>

                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#0b0c14] p-6">
                    <div className="w-full max-w-[520px]">
                        <div className="mb-4">
                            <p className="text-sm text-purple-300">Editando plantilla</p>
                            <h1 className="text-2xl font-bold">{template.title}</h1>
                            <p className="text-sm text-gray-400">{template.category}</p>
                        </div>

                        <FlyerCanvas title={template.title} category={template.category} />
                    </div>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold">Propiedades</h2>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs text-gray-400">
                                Título
                            </label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                                defaultValue={template.title}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-gray-400">
                                Categoría
                            </label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                                defaultValue={template.category}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-gray-400">
                                Fuente
                            </label>
                            <select className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none">
                                <option>Bebas Neue</option>
                                <option>Anton</option>
                                <option>Montserrat</option>
                                <option>Playfair Display</option>
                                <option>Great Vibes</option>
                            </select>
                        </div>

                        <button className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold hover:bg-purple-500">
                            Guardar cambios
                        </button>
                    </div>
                </aside>
            </section>
        </AppShell>
    );
}