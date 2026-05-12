"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

// ── MATRIX RAIN ──────────────────────────────────────────────────────────────
const MATRIX_CHARS = "ARTEGENIA✦⚡♪★◆▲".split("");

function MatrixRain({ opacity = 0.35 }: { opacity?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        window.addEventListener("resize", resize);
        const cols = Math.floor(canvas.width / 24);
        const drops = Array(cols).fill(1).map(() => Math.random() * -60);
        const COLORS = ["#b8860b", "#a855f7", "#ec4899", "#facc15", "#6366f1"];
        const draw = () => {
            ctx.fillStyle = "rgba(7,7,15,0.06)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drops.forEach((y, i) => {
                const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
                ctx.fillStyle = COLORS[i % COLORS.length];
                ctx.globalAlpha = opacity;
                ctx.font = "13px monospace";
                ctx.fillText(char, i * 24 + 6, y * 22);
                ctx.globalAlpha = 1;
                if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                else drops[i]++;
            });
        };
        const id = setInterval(draw, 55);
        return () => { clearInterval(id); window.removeEventListener("resize", resize); };
    }, [opacity]);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ── TYPEWRITER ────────────────────────────────────────────────────────────────
const EXAMPLES = [
    "Crea un flyer para noche de salsa con 2 artistas...",
    "Festival de bachata en Barcelona el sábado...",
    "Concierto electrónico con DJ Neon en Valencia...",
    "Gala de jazz en el Teatro Real de Madrid...",
    "Festival urbano con 5 artistas en vivo...",
];

function useTypewriter() {
    const [text, setText] = useState("");
    const [exIdx, setExIdx] = useState(0);
    const [phase, setPhase] = useState<"typing"|"pause"|"erasing">("typing");
    const charIdx = useRef(0);
    useEffect(() => {
        const current = EXAMPLES[exIdx];
        let t: ReturnType<typeof setTimeout>;
        if (phase === "typing") {
            if (charIdx.current < current.length) {
                t = setTimeout(() => { setText(current.slice(0, charIdx.current + 1)); charIdx.current++; }, 42);
            } else { t = setTimeout(() => setPhase("pause"), 2200); }
        } else if (phase === "pause") {
            t = setTimeout(() => setPhase("erasing"), 400);
        } else {
            if (charIdx.current > 0) {
                t = setTimeout(() => { charIdx.current--; setText(current.slice(0, charIdx.current)); }, 20);
            } else { setExIdx(i => (i + 1) % EXAMPLES.length); setPhase("typing"); }
        }
        return () => clearTimeout(t);
    }, [text, phase, exIdx]);
    return text;
}

// ── CAROUSEL ──────────────────────────────────────────────────────────────────
const TEMPLATES = [
    { id: 1, title: "Don Filosofín Live", sub: "Concierto · Barcelona", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400", accent: "#b8860b" },
    { id: 2, title: "Urban Party", sub: "Urbano · Madrid", img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400", accent: "#facc15" },
    { id: 3, title: "DJ Neon", sub: "Discoteca · Valencia", img: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=400", accent: "#22d3ee" },
    { id: 4, title: "Salsa Caliente", sub: "Salsa · Sevilla", img: "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=400", accent: "#fb923c" },
    { id: 5, title: "Festival Aurora", sub: "Festival · Ibiza", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=400", accent: "#34d399" },
    { id: 6, title: "Bachata Nights", sub: "Bachata · Málaga", img: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=400", accent: "#ec4899" },
    { id: 7, title: "Vibra Fest", sub: "Urbano · Bilbao", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400", accent: "#a855f7" },
];

function Carousel() {
    return (
        <div className="relative w-full px-2">
            <Swiper
                modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
                effect="coverflow"
                grabCursor
                centeredSlides
                slidesPerView="auto"
                loop
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                navigation={{
                    nextEl: ".swiper-next",
                    prevEl: ".swiper-prev",
                }}
                pagination={{ el: ".swiper-dots", clickable: true, bulletClass: "swiper-dot", bulletActiveClass: "swiper-dot-active" }}
                coverflowEffect={{
                    rotate: 30,
                    stretch: 0,
                    depth: 200,
                    modifier: 1.2,
                    slideShadows: true,
                }}
                className="w-full"
                style={{ paddingBottom: "20px" }}
            >
                {TEMPLATES.map(t => (
                    <SwiperSlide key={t.id} style={{ width: "220px", height: "300px" }}>
                        {({ isActive }) => (
                            <Link href={`/editor/${t.id}`} className="block w-full h-full rounded-2xl overflow-hidden relative shadow-2xl border border-white/10 group">
                                <img src={t.img} alt={t.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)" }} />
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <div className="w-8 h-0.5 mb-2 rounded" style={{ background: t.accent }} />
                                    <p className="text-white font-black text-sm leading-tight">{t.title}</p>
                                    <p className="text-xs mt-0.5" style={{ color: t.accent }}>{t.sub}</p>
                                    {isActive && (
                                        <span className="mt-3 inline-block text-xs font-bold px-4 py-1.5 rounded-lg text-black"
                                            style={{ background: t.accent }}>
                                            + Usar plantilla
                                        </span>
                                    )}
                                </div>
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl pointer-events-none"
                                        style={{ boxShadow: `0 0 40px ${t.accent}55, inset 0 0 0 1px ${t.accent}44` }} />
                                )}
                            </Link>
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Custom nav buttons */}
            <button className="swiper-prev absolute left-0 top-1/2 -translate-y-8 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white text-xl transition-all hover:scale-110">‹</button>
            <button className="swiper-next absolute right-0 top-1/2 -translate-y-8 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white text-xl transition-all hover:scale-110">›</button>

            {/* Dots */}
            <div className="swiper-dots flex justify-center gap-1.5 mt-4" />

            <style>{`
                .swiper-dot { width:8px; height:8px; border-radius:999px; background:rgba(255,255,255,0.2); display:inline-block; cursor:pointer; transition:all .3s; }
                .swiper-dot-active { width:24px; background:#a855f7; }
            `}</style>
        </div>
    );
}

// ── PAGE ──// ── PAGE ──────────────────────────────────────────────────────────────────────
const CHIPS = ["Noche de salsa en discoteca", "Concierto de reggaetón", "Festival de música urbana", "Evento de bachata"];
const FILTERS = [
    { icon: "👤", label: "2 artistas" },
    { icon: "🏛️", label: "Discoteca" },
    { icon: "📅", label: "Viernes por la noche" },
    { icon: "💡", label: "Ideas aleatorias" },
];

export default function Home() {
    const typedText = useTypewriter();
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async (text?: string) => {
        const t = text || prompt;
        if (!t.trim()) return;
        setGenerating(true);
        await new Promise(r => setTimeout(r, 1500));
        setGenerating(false);
        window.location.href = "/templates";
    };

    return (
        <div className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-4 pb-0 overflow-hidden">
                <MatrixRain opacity={0.3} />

                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-700/10 rounded-full blur-[160px]" />
                </div>

                <div className="relative z-10 w-full max-w-3xl mx-auto text-center">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-sm font-medium mb-4">
                        <span className="text-yellow-400">⚡</span> IA que entiende tu evento y crea magia
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight tracking-tight whitespace-nowrap">
                        Diseña flyers que{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">
                            impactan
                        </span>
                    </h1>

                    <p className="text-gray-400 text-base mb-4">
                        Describe tu evento y la <span className="text-purple-400 font-semibold">IA</span> genera el flyer perfecto.
                    </p>

                    {/* Chat box */}
                    <div className="rounded-2xl bg-[#0f0f1e] border border-white/10 shadow-2xl overflow-hidden mb-4">
                        {/* Input area */}
                        <div className="px-5 pt-4 pb-2">
                            <div className="flex items-start gap-3">
                                <span className="text-purple-400 mt-1">✦</span>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        rows={2}
                                        className="w-full bg-transparent text-white text-base outline-none resize-none placeholder-transparent"
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                                    />
                                    {!prompt && (
                                        <div className="absolute top-0 left-0 text-gray-500 text-base pointer-events-none select-none">
                                            {typedText}<span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleGenerate()} disabled={generating || !prompt.trim()}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all ${prompt.trim() && !generating ? "bg-purple-600 hover:bg-purple-500 text-white hover:scale-105 shadow-lg shadow-purple-500/20" : "bg-white/5 text-gray-600 cursor-not-allowed"}`}>
                                    {generating
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generando...</>
                                        : <><span>✦</span> Generar flyer</>}
                                </button>
                            </div>
                        </div>

                        {/* Chips */}
                        <div className="px-5 pb-3 flex flex-wrap gap-2">
                            {CHIPS.map(chip => (
                                <button key={chip} onClick={() => { setPrompt(chip); handleGenerate(chip); }}
                                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-white transition-all">
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Filters bar */}
                        <div className="border-t border-white/[0.06] px-5 py-3 flex items-center gap-4 overflow-x-auto">
                            {FILTERS.map(f => (
                                <button key={f.label} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap">
                                    <span>{f.icon}</span> {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-gray-700 mb-6">Sin registro · Gratis para empezar · Descarga en PNG</p>
                </div>

                {/* Carousel section */}
                <div className="relative z-10 w-full max-w-6xl mx-auto pb-8">
                    {/* Header + category filters */}
                    <div className="flex items-center justify-between mb-4 px-4">
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-400">✦</span>
                            <span className="font-bold text-white">Plantillas que inspiran</span>
                        </div>
                        <Link href="/templates" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                            Ver todas las plantillas →
                        </Link>
                    </div>
                    {/* Category chips */}
                    <div className="flex gap-2 px-4 mb-6 overflow-x-auto pb-1">
                        {["Todas","Salsa","Bachata","Urbano","Festival","Concierto","Premium","1 artista","2 artistas"].map((cat, i) => (
                            <button key={cat} className={`text-xs px-4 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${i === 0 ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20"}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <Carousel />
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="border-t border-white/[0.05] bg-[#080810]">
                <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { icon: "⚡", title: "IA Inteligente", desc: "Entiende tu evento y crea diseños únicos." },
                        { icon: "🎨", title: "Diseños Profesionales", desc: "Plantillas de alta calidad listas para usar." },
                        { icon: "✏️", title: "Personaliza Fácil", desc: "Edita colores, textos y elementos al instante." },
                        { icon: "⬇️", title: "Descarga en HD", desc: "Listo para imprimir o compartir online." },
                    ].map((f, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                                {f.icon}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{f.title}</p>
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.05] px-6 py-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black">AG</div>
                        <span className="font-bold text-sm">ArteGenIA</span>
                    </div>
                    <p className="text-gray-600 text-xs">© 2025 ArteGenIA</p>
                    <Link href="/templates" className="text-xs text-gray-600 hover:text-white transition-colors">Plantillas</Link>
                </div>
            </footer>
        </div>
    );
}
