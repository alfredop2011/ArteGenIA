"use client";
import MatrixRain from "@/components/home/MatrixRain";
import HeroChat from "@/components/home/HeroChat";
import TemplateCarousel3D from "@/components/home/TemplateCarousel3D";

const BENEFITS = [
    { icon: "⚡", title: "Genera en segundos", sub: "Con IA avanzada" },
    { icon: "🎨", title: "Edita por capas", sub: "Personaliza cada detalle" },
    { icon: "⬇️", title: "Descarga en alta calidad", sub: "PNG listo para imprimir" },
    { icon: "🎁", title: "Sin registro", sub: "Gratis para empezar" },
];

export default function Home() {
    return (
        <div className="bg-[#05050b] text-white overflow-x-hidden">
            <div className="relative overflow-x-hidden">
                {/* Background Matrix rain */}
                <MatrixRain />
                {/* Center glow */}
                <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ width: "700px", height: "350px", background: "radial-gradient(ellipse, rgba(80,20,160,0.14) 0%, transparent 70%)", zIndex: 0 }} />

                {/* Page content — normal flow, no overflow-hidden */}
                <div className="relative flex flex-col items-center w-full max-w-[1350px] mx-auto px-8 lg:px-12"
                    style={{ zIndex: 10, paddingTop: "16px" }}>

                    {/* Title */}
                    <h1 className="font-black text-center leading-none tracking-tight mb-1 whitespace-nowrap"
                        style={{ fontSize: "clamp(1.9rem, 3.2vw, 3.4rem)" }}>
                        Diseña flyers que{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">
                            impactan
                        </span>
                    </h1>
                    <p className="text-gray-400 text-xs mb-3 text-center">
                        Describe tu evento y la <span className="text-purple-400 font-semibold">IA</span> genera el flyer perfecto.
                    </p>

                    {/* Chat */}
                    <div className="w-full mb-4">
                        <HeroChat />
                    </div>

                    {/* Carousel focus glow */}
                    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ width:"900px", height:"400px", background:"radial-gradient(ellipse at 50% 60%, rgba(120,40,200,0.12) 0%, rgba(200,160,20,0.05) 50%, transparent 70%)", zIndex:0, top:"auto" }} />

                    {/* Carousel — in normal flow, overflow visible */}
                    <div className="relative w-full" style={{ overflow: "visible", zIndex: 1 }}>
                        <TemplateCarousel3D />
                    </div>

                    {/* Benefits — after carousel, normal flow */}
                    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pb-6 max-w-[1200px]">
                        {BENEFITS.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 0 12px rgba(168,85,247,0.2)" }}>
                                    {b.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-xs leading-tight" style={{color:"#fff"}}>{b.title}</p>
                                    <p className="text-xs leading-tight" style={{color:"#9ca3af"}}>{b.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
