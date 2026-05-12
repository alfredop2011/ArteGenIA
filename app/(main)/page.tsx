import Link from "next/link";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">
            <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
                    <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[80px]" />
                    <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8">
                        ⚡ Crea flyers profesionales en segundos
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
                        Diseña flyers que{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                            impactan
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Plantillas profesionales para eventos, conciertos y festivales. Edita, personaliza y descarga en segundos.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/templates" className="px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
                            🎨 Ver plantillas gratis
                        </Link>
                        <Link href="/templates" className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all">
                            Ver ejemplos →
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-gray-600">Sin registro · Gratis para empezar · Descarga en PNG</p>
                </div>
            </section>

            <section className="px-6 py-24 max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Todo lo que necesitas</h2>
                <p className="text-gray-400 text-center mb-16 text-lg">Para crear flyers profesionales sin ser diseñador</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: "🎨", title: "Plantillas profesionales", desc: "Más de 8 plantillas diseñadas para eventos reales. Conciertos, festivales, discotecas y más." },
                        { icon: "✏️", title: "Editor fácil", desc: "Edita textos, colores y posición de imágenes con un editor visual intuitivo. Sin experiencia necesaria." },
                        { icon: "⚡", title: "Descarga instantánea", desc: "Exporta tu flyer en alta resolución listo para redes sociales o impresión." },
                        { icon: "📱", title: "Múltiples formatos", desc: "Post cuadrado, historia vertical o flyer tradicional. Adapta tu diseño a cada plataforma." },
                        { icon: "🖼️", title: "Sube tu foto", desc: "Añade la foto del artista directamente en el editor. Recorta, escala y posiciona como quieras." },
                        { icon: "✂️", title: "Quita el fondo", desc: "Elimina el fondo de cualquier imagen con un solo clic usando inteligencia artificial." },
                    ].map((f, i) => (
                        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.06] transition-colors">
                            <div className="text-3xl mb-4">{f.icon}</div>
                            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-6 py-24">
                <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/20 p-12">
                    <h2 className="text-3xl md:text-5xl font-black mb-4">Empieza a crear ahora</h2>
                    <p className="text-gray-400 text-lg mb-8">Gratis, sin registro, en segundos.</p>
                    <Link href="/templates" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg transition-all hover:scale-105">
                        🎨 Explorar plantillas
                    </Link>
                </div>
            </section>

            <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-gray-600 text-sm">
                <p>© 2025 ArteGenIA · Creado con ❤️ para artistas y organizadores de eventos</p>
            </footer>
        </div>
    );
}
