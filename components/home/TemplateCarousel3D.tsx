"use client";
import { useState, useEffect, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Navigation, Pagination } from "swiper/modules";
import Link from "next/link";
import { Sparkles, Copy, ArrowRight } from "lucide-react";
import { templates as catalogTemplates, type Template } from "@/data/templates";
import TemplateFabricThumbnail from "@/components/templates/TemplateFabricThumbnail";
import "swiper/css";
import "swiper/css/effect-coverflow";

// Categorias que se muestran como filtros (visuales por ahora — no filtran).
const CATS = ["Todas","Fiesta","Conciertos","Festival","Clases","Gala"];

// Color accent por categoria — armoniza el look del carrusel.
const CATEGORY_ACCENTS: Record<string, string> = {
    "Fiesta":            "#c084fc",
    "Conciertos":        "#22d3ee",
    "Concierto":         "#22d3ee",
    "Festival":          "#fb923c",
    "Clases":            "#84cc16",
    "Gala":              "#fbbf24",
    "Corporativo":       "#fbbf24",
    "Club / Discoteca":  "#a855f7",
};

type CarouselItem = {
    id: number;
    name: string;
    accent: string;
    tag: string;
    template: Template; // Plantilla original — para renderizar el flyer real
};

/**
 * Mapea el catalogo oficial al shape del carrusel.
 *
 * Filtra solo plantillas con variante POST DE INSTAGRAM (square 1080x1080) y
 * conserva el Template original para que cada card pueda renderizar el flyer
 * REAL (no solo la foto del artista). Asi el usuario ve en el home lo mismo
 * que va a editar — sin sorpresa.
 */
function buildCarouselItems(): CarouselItem[] {
    return catalogTemplates
        .filter(t => t.variants.some(v => v.format === "square"))
        .map(t => ({
            id: t.id,
            name: t.title.toUpperCase(),
            accent: CATEGORY_ACCENTS[t.category] ?? "#a855f7",
            tag: t.category.toUpperCase(),
            template: t,
        }));
}

// Dimensiones cuadradas: el formato post de Instagram es 1:1 — el card
// muestra el thumbnail al mismo ratio para que se vea exactamente como
// se vera publicado.
const CARD_W = 320;
const CARD_H = 320;
const CARD_W_MOBILE = 240;
const CARD_H_MOBILE = 240;

export default function TemplateCarousel3D() {
    // Detecta mobile en cliente
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Items del carrusel = catalogo oficial completo. useMemo porque
    // catalogTemplates es estable y queremos evitar rebuilds en re-render.
    const TEMPLATES = useMemo(() => buildCarouselItems(), []);

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
                                <div className="w-full h-full rounded-2xl overflow-hidden relative bg-[#0a0a0f]"
                                    style={{
                                        border: isActive ? `1.5px solid ${t.accent}99` : "1px solid rgba(255,255,255,0.09)",
                                        boxShadow: isActive
                                            ? `0 0 45px rgba(168,85,247,.38), 0 0 35px rgba(250,204,21,.22), 0 30px 60px rgba(0,0,0,0.5)`
                                            : "0 15px 35px rgba(0,0,0,0.45)",
                                        opacity: isActive ? 1 : 0.78,
                                        transform: isActive ? "scale(1.12) translateY(-8px)" : "scale(1)",
                                        transition: "all 0.45s cubic-bezier(0.34,1.2,0.64,1)",
                                    }}>
                                    {/* Render REAL del flyer (mismo motor que el editor).
                                        Asi lo que el usuario ve aqui es exactamente lo que
                                        va a abrir en /editor — sin friccion de expectativa. */}
                                    <TemplateFabricThumbnail
                                        template={t.template}
                                        formatId="square"
                                        className="absolute inset-0 h-full w-full"
                                    />

                                    {/* Tag flotante arriba (categoria) — discreto, no tapa el flyer */}
                                    <div className="absolute top-2.5 left-2.5 z-10">
                                        <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full backdrop-blur-md"
                                            style={{ color: t.accent, background: "rgba(0,0,0,0.55)", border: `1px solid ${t.accent}55` }}>
                                            {t.tag}
                                        </span>
                                    </div>

                                    {/* CTA flotante abajo — solo cuando active.
                                        Aparece sobre el flyer sin tapar info importante. */}
                                    {isActive && (
                                        <div className="absolute inset-x-0 bottom-0 p-3 z-10">
                                            <Link href={`/editor/${t.id}?format=square`}
                                                className="w-full inline-flex items-center justify-center gap-1.5 font-black px-4 py-2 rounded-xl text-black transition-transform hover:scale-[1.02] backdrop-blur"
                                                style={{ fontSize: "0.82rem", background: "linear-gradient(135deg,#facc15,#f59e0b)", boxShadow: "0 4px 20px rgba(250,204,21,0.55), 0 0 30px rgba(168,85,247,0.25)" }}
                                                onClick={e => e.stopPropagation()}>
                                                <Copy size={13} strokeWidth={2.2} />
                                                Usar plantilla
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </>
    );
}
