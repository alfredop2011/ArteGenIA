const templates = [
    {
        id: 1,
        title: "Noche Magnética",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
        premium: true,
    },
    {
        id: 2,
        title: "Urban Party",
        category: "Concierto",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800",
        premium: false,
    },
    {
        id: 3,
        title: "DJ Neon",
        category: "Discoteca",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
        premium: true,
    },
    {
        id: 4,
        title: "Evento Premium",
        category: "Flyer",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
        premium: false,
    },
];

export default function TemplatesPage() {
    return (
        <main className="min-h-screen bg-[#070711] text-white">
            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="mb-2 text-sm font-medium text-purple-300">
                            ArteGenIA
                        </p>
                        <h1 className="text-3xl font-bold md:text-5xl">
                            Plantillas editables
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
                            Elige una plantilla, cambia textos, sube la foto del artista,
                            quita el fondo y exporta tu flyer.
                        </p>
                    </div>

                    <button className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500">
                        Generar con IA
                    </button>
                </div>

                <div className="mb-8 flex flex-wrap gap-3">
                    {["Todo", "Fiesta", "Concierto", "Discoteca", "Cumpleaños", "Negocio"].map(
                        (item) => (
                            <button
                                key={item}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
                            >
                                {item}
                            </button>
                        )
                    )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {templates.map((template) => (
                        <article
                            key={template.id}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <img
                                    src={template.image}
                                    alt={template.title}
                                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                                />

                                {template.premium && (
                                    <span className="absolute right-3 top-3 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                    PRO
                  </span>
                                )}
                            </div>

                            <div className="p-4">
                                <p className="text-xs uppercase tracking-wide text-purple-300">
                                    {template.category}
                                </p>
                                <h2 className="mt-1 text-lg font-bold">{template.title}</h2>

                                <button className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200">
                                    Usar plantilla
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}