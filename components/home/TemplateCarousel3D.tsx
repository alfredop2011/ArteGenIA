"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Navigation, Pagination } from "swiper/modules";
import Link from "next/link";
import { Sparkles, Copy, ArrowRight } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-coverflow";

const CATS = ["Todas","Fiesta","Concierto","Festival","Clases"];

const TEMPLATES = [
    { id: 22, name: "NOCHE LATINA",        date: "SÁB 25 MAY",          venue: "Discoteca Elegance",       img: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=600", accent: "#c084fc", tag: "FIESTA" },
    { id: 23, name: "NEON NIGHT",          date: "VIE 31 MAYO · 11PM",  venue: "Club Kings · Madrid",      img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600", accent: "#a855f7", tag: "FIESTA" },
    { id: 24, name: "FESTIVAL SUMMER",     date: "15 JUNIO 2026",       venue: "Parque Fundidora",         img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600", accent: "#fb923c", tag: "FESTIVAL" },
    { id: 25, name: "NOCHE EN VIVO",       date: "VIE 24 MAYO · 11PM",  venue: "Club Latino · Madrid",     img: "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=600", accent: "#facc15", tag: "FIESTA" },
    { id: 26, name: "CONCIERTO ACÚSTICO",  date: "JUE 13 JUNIO",        venue: "Teatro Metropolitan",      img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=600", accent: "#22d3ee", tag: "CONCIERTO" },
    { id: 27, name: "CLASE ABIERTA",       date: "SÁB 08 JUNIO",        venue: "Estudio Movimiento",       img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=600", accent: "#c084fc", tag: "CLASES" },
    { id: 28, name: "GRAN GALA",           date: "SÁB 01 JUNIO",        venue: "Arena Monterrey",          img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600", accent: "#fb923c", tag: "FESTIVAL" },
];

const CARD_W = 300;
const CARD_H = 400;
const CARD_W_MOBILE = 220;
const CARD_H_MOBILE = 295;

export default function TemplateCarousel3D() {
    // Detecta mobile en cliente
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const w = isMobile ? CARD_W_MOBILE : CARD_W;
    const h = isMobile ? CARD_H_MOBILE : CARD_H;

    return (
        <>
            {/* Header + chips */}
            <div className="flex items-center justify-between mb-2 px-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Sparkles size={15} strokeWidth={2} className="text-yellow-400 shrink-0" />
                    <span className="text-white font-bold text-xs sm:text-sm truncate">Plantillas que inspiran</span>
                </div>
                <a href="/templates" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors shrink-0">
                    <span className="hidden sm:inline">Ver todas las plantillas</span>
                    <span className="sm:hidden">Ver todas</span>
                    <ArrowRight size={12} strokeWidth={2} />
                </a>
            </div>
            <div className="flex gap-1.5 mb-3 px-2 overflow-x-auto scrollbar-hide">
                {CATS.map((c, i) => (
                    <button key={c}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${i === 0 ? "text-white" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"}`}
                        style={i === 0 ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "1px solid rgba(168,85,247,0.5)" } : {}}>
                        {c}
                    </button>
                ))}
            </div>

            {/* Carousel */}
            <div className="relative w-full mx-auto" style={{ height: `${h + 20}px` }}>

                {/* Floor glow */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ width: "min(1000px, 100vw)", height: "130px", background: "radial-gradient(ellipse at center, rgba(168,85,247,0.45) 0%, rgba(250,204,21,0.18) 40%, transparent 70%)", filter: "blur(22px)", opacity: 0.85 }} />

                {/* Nav buttons - SOLO DESKTOP (en mobile el carrusel se desliza con dedo) */}
                <button className="swiper-btn-prev hidden md:flex absolute left-0 z-20 items-center justify-center text-white text-2xl font-bold rounded-full transition-all hover:scale-110"
                    style={{ width: "50px", height: "50px", top: `${h / 2 - 25}px`, background: "rgba(124,58,237,0.85)", border: "1px solid rgba(196,132,252,0.5)", boxShadow: "0 0 25px rgba(168,85,247,0.55)" }}>
                    ‹
                </button>
                <button className="swiper-btn-next hidden md:flex absolute right-0 z-20 items-center justify-center text-white text-2xl font-bold rounded-full transition-all hover:scale-110"
                    style={{ width: "50px", height: "50px", top: `${h / 2 - 25}px`, background: "rgba(124,58,237,0.85)", border: "1px solid rgba(196,132,252,0.5)", boxShadow: "0 0 25px rgba(168,85,247,0.55)" }}>
                    ›
                </button>

                <Swiper
                    modules={[EffectCoverflow, Autoplay, Navigation, Pagination]}
                    effect="coverflow"
                    grabCursor
                    centeredSlides
                    slidesPerView="auto"
                    loop
                    autoplay={{ delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    navigation={{ nextEl: ".swiper-btn-next", prevEl: ".swiper-btn-prev" }}
                    coverflowEffect={isMobile
                        ? { rotate: 15, stretch: 0, depth: 120, modifier: 1.2, slideShadows: false }
                        : { rotate: 20, stretch: 10, depth: 200, modifier: 1.4, slideShadows: false }
                    }
                    style={{ width: "100%", height: `${h + 10}px`, overflow: "visible" }}
                >
                    {TEMPLATES.map(t => (
                        <SwiperSlide key={t.id} style={{ width: `${w}px`, height: `${h}px` }}>
                            {({ isActive }) => (
                                <div className="w-full h-full rounded-2xl overflow-hidden relative"
                                    style={{
                                        border: isActive ? `1.5px solid ${t.accent}99` : "1px solid rgba(255,255,255,0.09)",
                                        boxShadow: isActive
                                            ? `0 0 45px rgba(168,85,247,.38), 0 0 35px rgba(250,204,21,.22), 0 30px 60px rgba(0,0,0,0.5)`
                                            : "0 15px 35px rgba(0,0,0,0.45)",
                                        opacity: isActive ? 1 : 0.78,
                                        transform: isActive ? "scale(1.12) translateY(-8px)" : "scale(1)",
                                        transition: "all 0.45s cubic-bezier(0.34,1.2,0.64,1)",
                                    }}>
                                    <img src={t.img} alt={t.name} className="w-full h-full object-cover" crossOrigin="anonymous" />

                                    {/* Overlay — lighter on active */}
                                    <div className="absolute inset-0" style={{
                                        background: isActive
                                            ? "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.0) 100%)"
                                            : "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.05) 100%)"
                                    }} />

                                    {/* Top tag */}
                                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                                        <span className="text-xs font-bold tracking-widest px-3 py-0.5 rounded-full"
                                            style={{ color: t.accent, background: "rgba(0,0,0,0.55)", border: `1px solid ${t.accent}55` }}>
                                            {t.tag}
                                        </span>
                                    </div>

                                    {/* Bottom content */}
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <div className="w-8 h-0.5 mb-2 rounded" style={{ background: t.accent }} />
                                        <h3 className="font-black text-white leading-tight mb-1"
                                            style={{ fontSize: isActive ? "1.15rem" : "0.85rem", textShadow: `0 0 20px ${t.accent}66` }}>
                                            {t.name}
                                        </h3>
                                        <p style={{ color: t.accent, fontSize: "0.7rem", fontWeight: "bold" }}>{t.date}</p>
                                        <p className="text-gray-400 mb-1" style={{ fontSize: "0.65rem" }}>{t.venue}</p>
                                        <p className="text-gray-600" style={{ fontSize: "0.6rem" }}>ENTRADAS EN ARTEGENIA.COM</p>

                                        {isActive && (
                                            <Link href={`/editor/${t.id}`}
                                                className="mt-3 inline-flex items-center gap-1.5 font-black px-4 py-1.5 rounded-xl text-black transition-transform hover:scale-105"
                                                style={{ fontSize: "0.8rem", background: "linear-gradient(135deg,#facc15,#f59e0b)", boxShadow: "0 4px 20px rgba(250,204,21,0.5), 0 0 30px rgba(168,85,247,0.25)" }}
                                                onClick={e => e.stopPropagation()}>
                                                <Copy size={13} strokeWidth={2.2} />
                                                Usar plantilla
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </>
    );
}
