"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const EXAMPLES = [
    "Festival de salsa en Madrid este verano...",
    "Concierto de bachata en Barcelona...",
    "Noche electrónica en Valencia...",
    "Festival urbano con 5 artistas...",
    "Gala de jazz en el Teatro Real...",
];

const TEMPLATES = [
    { title: "Don Filosofín Live", cat: "Concierto", bg: "from-yellow-900 via-amber-900 to-black", accent: "#b8860b" },
    { title: "Urban Party", cat: "Urbano", bg: "from-purple-900 via-indigo-900 to-black", accent: "#facc15" },
    { title: "DJ Neon", cat: "Discoteca", bg: "from-cyan-900 via-blue-900 to-black", accent: "#22d3ee" },
    { title: "Evento Premium", cat: "Gala", bg: "from-gray-900 via-slate-800 to-black", accent: "#facc15" },
    { title: "Salsa Caliente", cat: "Salsa", bg: "from-red-900 via-orange-900 to-black", accent: "#fb923c" },
    { title: "Festival Aurora", cat: "Festival", bg: "from-green-900 via-teal-900 to-black", accent: "#34d399" },
    { title: "Bachata Nights", cat: "Bachata", bg: "from-pink-900 via-rose-900 to-black", accent: "#ec4899" },
    { title: "Vibra Fest", cat: "Urbano", bg: "from-violet-900 via-purple-900 to-black", accent: "#a855f7" },
];

export default function Home() {
    const [placeholder, setPlaceholder] = useState(EXAMPLES[0]);
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % EXAMPLES.length;
            setPlaceholder(EXAMPLES[i]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        await new Promise(r => setTimeout(r, 1500));
        setGenerating(false);
        window.location.href = "/templates";
    };

    return (
        <div className="bg-[#07070f] text-white overflow-x-hidden">
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[140px]" />
                    <div className="absolute top-1/3 left-1/5 w-[350px] h-[350px] bg-pink-600/10 rounded-full blur-[100px]" />
                    <div className="absolute top-1/3 right-1/5 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px]" />
                </div>

                {["🎵","🎨","⚡","🎸","🎤","✨","🎭","🎪"].map((emoji, i) => (
                    <span key={i} className="absolute text-2xl opacity-20 select-none pointer-events-none animate-pulse"
                        style={{ top: `${15 + (i * 11) % 70}%`, left: `${5 + (i * 13) % 90}%`, animationDelay: `${i * 0.5}s` }}>
                        {emoji}
                    </span>
                ))}

                <div className="relative z-10 max-w-4xl mx-auto w-full">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8">
                        ⚡ Crea flyers profesionales con IA
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
                        Diseña flyers que{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                            impactan
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Describe tu evento y la IA genera el flyer perfecto. O elige una plantilla profesional.
                    </p>

                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="relative rounded-2xl bg-white/[0.06] border border-white/10 p-1 focus-within:border-purple-500/50 transition-colors">
                            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                                placeholder={placeholder} rows={2}
                                className="w-full bg-transparent px-4 pt-3 pb-2 text-white placeholder-gray-600 outline-none resize-none text-base"
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }} />
                            <div className="flex items-center justify-between px-3 pb-2">
                                <span className="text-xs text-gray-600">Pulsa Enter para generar</span>
                                <button onClick={handleGenerate} disabled={generating || !prompt.trim()}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${prompt.trim() && !generating ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-white/5 text-gray-600 cursor-not-allowed"}`}>
                                    {generating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</> : <>✨ Generar flyer</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <span className="text-gray-600 text-sm">o elige una plantilla →</span>
                        <Link href="/templates" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all hover:scale-105">
                            Ver todas las plantillas
                        </Link>
                    </div>
                </div>
            </section>

            <section className="px-6 py-16 bg-[#07070f]">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black mb-2">Plantillas que destacan</h2>
                    <p className="text-gray-400">Haz clic para editar</p>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 px-4 snap-x snap-mandatory">
                    {TEMPLATES.map((t, i) => (
                        <Link key={i} href="/templates"
                            className={`flex-shrink-0 snap-center w-48 h-72 rounded-2xl bg-gradient-to-b ${t.bg} border border-white/10 flex flex-col justify-end p-4 group hover:scale-105 transition-all duration-300 cursor-pointer`}>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/10 text-gray-300 w-fit">{t.cat}</span>
                            <h3 className="text-white font-black text-base mt-2 leading-tight">{t.title}</h3>
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-bold text-white bg-purple-600 px-3 py-1 rounded-lg">+ Usar</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="px-6 py-24 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black mb-4">Todo en un solo lugar</h2>
                    <p className="text-gray-400 text-xl">Sin Photoshop, sin diseñadores, sin esperas.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: "🤖", title: "IA generativa", desc: "Describe tu evento y la IA crea el flyer completo en segundos.", color: "from-purple-500/10 to-purple-500/5", border: "border-purple-500/20" },
                        { icon: "🎨", title: "Editor visual", desc: "Edita textos, colores e imágenes con drag & drop.", color: "from-pink-500/10 to-pink-500/5", border: "border-pink-500/20" },
                        { icon: "✂️", title: "Quita fondos", desc: "Elimina el fondo de fotos con un clic usando IA.", color: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/20" },
                        { icon: "📱", title: "Múltiples formatos", desc: "Post, historia, flyer A4. Un diseño, todos los formatos.", color: "from-blue-500/10 to-blue-500/5", border: "border-blue-500/20" },
                        { icon: "⬇️", title: "Descarga en HD", desc: "Exporta en PNG de alta resolución para Instagram o imprenta.", color: "from-yellow-500/10 to-yellow-500/5", border: "border-yellow-500/20" },
                        { icon: "⚡", title: "En segundos", desc: "Crea y descarga tu flyer en menos de 2 minutos.", color: "from-orange-500/10 to-orange-500/5", border: "border-orange-500/20" },
                    ].map((f, i) => (
                        <div key={i} className={`rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} p-6 hover:scale-105 transition-transform duration-300`}>
                            <div className="text-4xl mb-4">{f.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-6 py-24">
                <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-purple-900/50 via-pink-900/20 to-blue-900/30 border border-purple-500/20 p-16">
                    <h2 className="text-4xl md:text-6xl font-black mb-4">Crea tu primer flyer</h2>
                    <p className="text-gray-400 text-xl mb-10">Gratis · Sin registro · En segundos</p>
                    <Link href="/templates" className="px-10 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-lg transition-all hover:scale-105 inline-block">
                        🎨 Explorar plantillas
                    </Link>
                </div>
            </section>

            <footer className="border-t border-white/[0.06] px-6 py-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-black">AG</div>
                        <span className="font-bold text-white">ArteGenIA</span>
                    </div>
                    <p className="text-gray-600 text-sm">© 2025 ArteGenIA · Para artistas y organizadores de eventos</p>
                    <div className="flex gap-6 text-sm text-gray-600">
                        <Link href="/templates" className="hover:text-white transition-colors">Plantillas</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
