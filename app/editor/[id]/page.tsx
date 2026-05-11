import AppShell from "@/components/layout/AppShell";

export default function EditorPage() {
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
                    <div className="relative aspect-[4/5] w-full max-w-[430px] overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7c2dff55,transparent_35%),linear-gradient(180deg,#111827,#020617)]" />

                        <div className="absolute inset-x-8 top-10 flex justify-between text-center text-3xl font-black text-white">
                            <span>22:00</span>
                            <span>21 JUN</span>
                        </div>

                        <div className="absolute inset-x-8 top-36 rounded-full border border-yellow-400/60 bg-black/50 p-8 text-center">
                            <p className="text-5xl font-black tracking-wide text-yellow-300">
                                NOCHE
                            </p>
                            <p className="mt-1 text-4xl font-bold text-white">
                                Latina
                            </p>
                        </div>

                        <div className="absolute inset-x-8 bottom-36 text-center">
                            <p className="text-5xl font-black text-white">2026</p>
                            <p className="mt-2 text-xl font-bold text-yellow-300">
                                SALSA · BACHATA · REGGAETON
                            </p>
                        </div>

                        <div className="absolute inset-x-8 bottom-10 rounded-xl bg-yellow-400 px-4 py-3 text-center text-sm font-black text-black">
                            ENTRADA ANTICIPADA 25€
                        </div>
                    </div>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold">Propiedades</h2>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs text-gray-400">
                                Texto seleccionado
                            </label>
                            <input
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                                placeholder="NOCHE Latina"
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

                        <div>
                            <label className="mb-1 block text-xs text-gray-400">
                                Color
                            </label>
                            <input
                                type="color"
                                className="h-11 w-full rounded-xl border border-white/10 bg-black/40"
                            />
                        </div>

                        <button className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold hover:bg-purple-500">
                            Guardar cambios
                        </button>

                        <button className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black text-black hover:bg-yellow-300">
                            Exportar PNG
                        </button>
                    </div>
                </aside>
            </section>
        </AppShell>
    );
}