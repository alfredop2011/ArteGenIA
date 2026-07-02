"use client";

import Link from "next/link";
import { AlertTriangle, Fingerprint, Sparkles, Users, Palette, RefreshCw } from "lucide-react";

/**
 * /vs-chatgpt — Landing de posicionamiento anti-clon.
 *
 * Tesis central: ChatGPT+DALL-E/MidJourney inundan Instagram con
 * flyers casi idénticos (fondos hiperrealistas de multitudes, mismos
 * neones, mismas tipografías). El problema del "clon" a escala.
 * ArteGenIA es lo contrario — te da identidad visual reconocible.
 *
 * Estructura:
 *   1. Hero con problema
 *   2. Prueba visual — 8 flyers "estilo ChatGPT" idénticos (mockups CSS)
 *   3. Comparativa ChatGPT vs ArteGenIA (tabla)
 *   4. Cómo mantienes identidad (6 features clave)
 *   5. CTA final
 */

const CHATGPT_STYLE_FLYERS = [
    { title: "TONIGHT", subtitle: "DJ SET · SATURDAY", accent: "#ff00ff" },
    { title: "FIESTA", subtitle: "LIVE · 22:00", accent: "#00ffff" },
    { title: "PARTY", subtitle: "DJ NIGHT · 23H", accent: "#ff00ff" },
    { title: "NIGHT", subtitle: "MUSIC · WEEKEND", accent: "#00ffff" },
    { title: "TONIGHT", subtitle: "LIVE MUSIC", accent: "#ff00ff" },
    { title: "PARTY", subtitle: "SATURDAY NIGHT", accent: "#00ffff" },
    { title: "DJ SET", subtitle: "TONIGHT · 22H", accent: "#ff00ff" },
    { title: "NIGHT", subtitle: "PARTY · LIVE", accent: "#00ffff" },
];

const COMPARISON = [
    { row: "Fondo", chatgpt: "Multitud borrosa aleatoria cada vez", us: "Layout consistente que TÚ eliges" },
    { row: "Tipografías", chatgpt: "Impact / Arial Black por defecto", us: "45 combos curados (Bebas, Playfair, Anton...)" },
    { row: "Colores", chatgpt: "Magenta + cyan neón (siempre)", us: "TU paleta que se mantiene mes a mes" },
    { row: "Personas", chatgpt: "AI-generadas genéricas irreales", us: "Fotos REALES de tus DJs vía Colaboradores" },
    { row: "Consistencia", chatgpt: "Cada flyer es un mundo", us: "Duplicas base + cambias 3 cosas" },
    { row: "Marca", chatgpt: "Reemplazable — indistinguible", us: "Foso defensivo — reconocible a distancia" },
];

export default function VsChatGptPage() {
    return (
        <div className="min-h-screen bg-[#0e0e14] text-white">
            {/* Hero */}
            <div className="border-b border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-300" strokeWidth={2.4} />
                        <span className="text-[11px] font-semibold text-red-200 uppercase tracking-widest">
                            El problema del clon
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-balance">
                        Todos usan ChatGPT para flyers.{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                            Todos acaban con el mismo flyer.
                        </span>
                    </h1>
                    <p className="text-sm md:text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        El promotor con ChatGPT es reemplazable — su flyer podría ser de cualquier fiesta.
                        <br className="hidden md:block" />
                        El promotor con ArteGenIA construye <strong className="text-white">identidad visual propia</strong>. Cuando alguien vea tu flyer, sabrá que es TU noche antes de leer el nombre.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                        <Link
                            href="/templates"
                            className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.03] transition-transform"
                        >
                            Empezar sin ser un clon
                        </Link>
                        <Link
                            href="#prueba"
                            className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-semibold text-sm hover:bg-white/[0.10] transition-colors"
                        >
                            Ver la evidencia ↓
                        </Link>
                    </div>
                </div>
            </div>

            {/* Prueba visual — 8 flyers "estilo ChatGPT" idénticos */}
            <div id="prueba" className="border-b border-white/[0.06] bg-[#0b0b12]">
                <div className="max-w-6xl mx-auto px-6 py-14">
                    <div className="text-center mb-10">
                        <p className="text-[11px] uppercase tracking-widest text-red-300 font-bold mb-2">
                            Evidencia visual
                        </p>
                        <h2 className="text-2xl md:text-3xl font-black mb-3">
                            Todos estos flyers son de fiestas distintas.
                        </h2>
                        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                            Fondos hiperrealistas de multitudes borrosas, tipografía Impact/Arial Black,
                            neones magenta + cyan, composición central. ¿Adivinas cuál es cuál? Nadie puede.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CHATGPT_STYLE_FLYERS.map((f, i) => (
                            <div
                                key={i}
                                className="aspect-[3/4] rounded-lg overflow-hidden relative flex flex-col items-center justify-center text-center p-3"
                                style={{
                                    background: `radial-gradient(circle at 30% 30%, ${f.accent}44, transparent 60%), radial-gradient(circle at 70% 70%, ${f.accent === "#ff00ff" ? "#00ffff" : "#ff00ff"}33, transparent 60%), linear-gradient(180deg, #1a0a2e, #0a0510)`,
                                }}
                            >
                                {/* Silueta central para simular "multitud borrosa" */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="relative z-10">
                                    <div
                                        className="text-lg md:text-2xl font-black tracking-wider mb-1"
                                        style={{
                                            fontFamily: "Impact, 'Arial Black', sans-serif",
                                            color: f.accent,
                                            textShadow: `0 0 12px ${f.accent}`,
                                        }}
                                    >
                                        {f.title}
                                    </div>
                                    <div className="text-[9px] md:text-[10px] font-bold text-white/80 tracking-widest">
                                        {f.subtitle}
                                    </div>
                                </div>
                                <div className="absolute top-1.5 right-1.5 text-[8px] text-white/30 uppercase font-semibold">
                                    #{i + 1}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-[11px] text-gray-500 mt-6 max-w-xl mx-auto italic">
                        Mockups representativos del look predominante de flyers generados con IA genérica en 2026.
                        Cualquier parecido con flyers reales publicados en tu ciudad no es coincidencia.
                    </p>
                </div>
            </div>

            {/* Comparativa ChatGPT vs ArteGenIA */}
            <div className="max-w-5xl mx-auto px-6 py-14">
                <div className="text-center mb-10">
                    <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
                        Cara a cara
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black">
                        ChatGPT hace flyers. ArteGenIA hace tu MARCA.
                    </h2>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#13131f] overflow-hidden">
                    <div className="grid grid-cols-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Aspecto</div>
                        <div className="text-[11px] text-red-300 font-bold text-center">ChatGPT / IA genérica</div>
                        <div className="text-[11px] text-emerald-300 font-bold text-center">ArteGenIA</div>
                    </div>
                    {COMPARISON.map((row, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-3 px-4 py-4 border-b border-white/[0.04] last:border-0 items-start"
                        >
                            <div className="text-[13px] font-semibold text-white pr-2">{row.row}</div>
                            <div className="text-[12px] text-red-200/80 text-center leading-snug px-2">{row.chatgpt}</div>
                            <div className="text-[12px] text-emerald-200 text-center leading-snug font-medium px-2">{row.us}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cómo mantienes identidad — 6 features */}
            <div className="border-t border-b border-white/[0.06] bg-[#0b0b12]">
                <div className="max-w-5xl mx-auto px-6 py-14">
                    <div className="text-center mb-10">
                        <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold mb-2">
                            Tu foso defensivo
                        </p>
                        <h2 className="text-2xl md:text-3xl font-black">
                            Cómo construyes identidad visual con ArteGenIA
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            {
                                icon: Palette,
                                title: "Tu paleta se mantiene",
                                body: "Guardas los colores en Mis Recursos. Cada flyer nuevo los aplica. Los DJs invitados reconocen tu look antes de leer el nombre.",
                            },
                            {
                                icon: Fingerprint,
                                title: "Layout consistente semana a semana",
                                body: "El flyer del jueves se parece al del jueves pasado y al del que viene. Constancia visual = identidad de marca.",
                            },
                            {
                                icon: Users,
                                title: "Fotos REALES, no AI-slop",
                                body: "Tus DJs suben su foto por link. Personas de verdad, no personajes AI-generados que gritan 'ChatGPT'.",
                            },
                            {
                                icon: Sparkles,
                                title: "45 combos de texto curados",
                                body: "Cada preset tiene tipografía intencional (Bebas, Playfair, Anton). No las genéricas de ChatGPT.",
                            },
                            {
                                icon: RefreshCw,
                                title: "Duplicar + editar 3 cosas",
                                body: "El flyer de la próxima semana: duplicas el anterior, cambias fecha y line-up. Marca consistente, cero esfuerzo.",
                            },
                            {
                                icon: AlertTriangle,
                                title: "Diferenciación medible",
                                body: "Cuando el promotor rival publica con IA genérica y tú publicas con marca propia, el algoritmo de IG te premia — CTR mayor.",
                            },
                        ].map((it, i) => {
                            const Icon = it.icon;
                            return (
                                <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#13131f] p-5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-3">
                                        <Icon className="w-5 h-5 text-emerald-300" strokeWidth={2.2} />
                                    </div>
                                    <h3 className="text-[15px] font-bold mb-1.5">{it.title}</h3>
                                    <p className="text-[12px] text-gray-400 leading-relaxed">{it.body}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Frase final */}
            <div className="max-w-3xl mx-auto px-6 py-14 text-center">
                <p className="text-lg md:text-2xl font-black leading-tight text-gray-200 mb-3">
                    &ldquo;En el gremio hay dos tipos de promotores: <span className="text-red-300">el que su flyer es reemplazable</span>, y <span className="text-emerald-300">el que su flyer es un lugar</span>.&rdquo;
                </p>
                <p className="text-sm text-gray-500">
                    La diferencia son 5 minutos al mes cuando eliges la herramienta correcta.
                </p>
            </div>

            {/* CTA final */}
            <div className="border-t border-white/[0.06] bg-[#0b0b12]">
                <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                    <h2 className="text-2xl md:text-3xl font-black mb-4">
                        Sal del clon esta semana
                    </h2>
                    <p className="text-sm text-gray-400 mb-6 max-w-xl mx-auto">
                        Registro gratis, sin tarjeta. 10 créditos para hacer tu primer flyer con identidad propia.
                        Cuando lo publiques, el gremio va a notar la diferencia.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/templates"
                            className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.03] transition-transform"
                        >
                            Empezar gratis
                        </Link>
                        <Link
                            href="/comparativa-canva"
                            className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-semibold text-sm hover:bg-white/[0.10] transition-colors"
                        >
                            Comparativa vs Canva
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
