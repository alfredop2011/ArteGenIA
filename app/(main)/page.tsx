"use client";
import { Zap, Layers, Download, Gift, type LucideIcon } from "lucide-react";
import MatrixRain from "@/components/home/MatrixRain";
import HeroChat from "@/components/home/HeroChat";
import TemplateCarousel3D from "@/components/home/TemplateCarousel3D";

type Benefit = { icon: LucideIcon; title: string; sub: string };

const BENEFITS: Benefit[] = [
    { icon: Zap,      title: "Genera en segundos",        sub: "Con IA avanzada" },
    { icon: Layers,   title: "Edita por capas",            sub: "Personaliza cada detalle" },
    { icon: Download, title: "Descarga en alta calidad",   sub: "PNG listo para imprimir" },
    { icon: Gift,     title: "Sin registro",               sub: "Gratis para empezar" },
];

export default function Home() {
    return (
        <div className="bg-[#05050b] text-white overflow-x-hidden">
            <div className="relative overflow-x-hidden">
                {/* Background Matrix rain - OCULTO en mobile (es decorativo + pesado) */}
                <div className="hidden md:block">
                    <MatrixRain />
                </div>
                {/* Center glow - mas pequeno en mobile */}
                <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none w-[min(700px,90vw)]"
                    style={{ height: "350px", background: "radial-gradient(ellipse, rgba(80,20,160,0.14) 0%, transparent 70%)", zIndex: 0 }} />

                {/* Page content - padding lateral reducido en mobile */}
                <div className="relative flex flex-col items-center w-full max-w-[1350px] mx-auto px-4 sm:px-8 lg:px-12"
                    style={{ zIndex: 10, paddingTop: "16px" }}>

                    {/* Title - quitar whitespace-nowrap (rompia mobile), tamano responsive */}
                    <h1 className="font-black text-center leading-tight tracking-tight mb-1"
                        style={{ fontSize: "clamp(1.6rem, 6vw, 3.4rem)" }}>
                        Diseña flyers que{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">
                            impactan
                        </span>
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mb-3 text-center px-2">
                        Describe tu evento y la <span className="text-purple-400 font-semibold">IA</span> genera el flyer perfecto.
                    </p>

                    {/* Chat */}
                    <div className="w-full mb-4">
                        <HeroChat />
                    </div>

                    {/* Carousel focus glow */}
                    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ width:"min(900px, 100vw)", height:"400px", background:"radial-gradient(ellipse at 50% 60%, rgba(120,40,200,0.12) 0%, rgba(200,160,20,0.05) 50%, transparent 70%)", zIndex:0, top:"auto" }} />

                    {/* Carousel — in normal flow, overflow visible */}
                    <div className="relative w-full" style={{ overflow: "visible", zIndex: 1 }}>
                        <TemplateCarousel3D />
                    </div>

                    {/* Benefits — 2 cols mobile, 4 cols desktop */}
                    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4 pb-6 max-w-[1200px]">
                        {BENEFITS.map((b, i) => {
                            const Icon = b.icon;
                            return (
                                <div key={i} className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-2xl"
                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 text-purple-300"
                                        style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 0 12px rgba(168,85,247,0.2)" }}>
                                        <Icon size={16} strokeWidth={1.8} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[11px] sm:text-xs leading-tight truncate" style={{color:"#fff"}}>{b.title}</p>
                                        <p className="text-[10px] sm:text-xs leading-tight truncate" style={{color:"#9ca3af"}}>{b.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
