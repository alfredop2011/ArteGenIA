"use client";

import type { Template, TemplateLayer } from "@/data/templates";

interface TemplateCardProps {
    template: Template;
}

// Foto de fondo y estilos por template
const CARD_CONFIG: Record<number, {
    photo: string;
    gradient: string;
    titleColor: string;
    accentColor: string;
    titleFont: string;
}> = {
    1: {
        photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#ffffff",
        accentColor: "#b8860b",
        titleFont: "Bebas Neue",
    },
    2: {
        photo: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(7,7,17,0.95) 40%, rgba(30,11,64,0.5) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#facc15",
        accentColor: "#a78bfa",
        titleFont: "Bebas Neue",
    },
    3: {
        photo: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(2,6,23,0.95) 40%, rgba(34,211,238,0.2) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#22d3ee",
        accentColor: "#facc15",
        titleFont: "Bebas Neue",
    },
    4: {
        photo: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(17,24,39,0.95) 40%, rgba(250,204,21,0.15) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#facc15",
        accentColor: "#facc15",
        titleFont: "Playfair Display",
    },
    5: {
        photo: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(26,5,0,0.95) 40%, rgba(220,38,38,0.3) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#fef2f2",
        accentColor: "#fb923c",
        titleFont: "Bebas Neue",
    },
    6: {
        photo: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(10,10,26,0.95) 40%, rgba(16,185,129,0.25) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#ffffff",
        accentColor: "#34d399",
        titleFont: "Bebas Neue",
    },
    7: {
        photo: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(13,0,5,0.95) 40%, rgba(219,39,119,0.3) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#fce7f3",
        accentColor: "#ec4899",
        titleFont: "Bebas Neue",
    },
    8: {
        photo: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=600&h=750&fit=crop",
        gradient: "linear-gradient(to top, rgba(5,0,20,0.95) 40%, rgba(124,58,237,0.3) 70%, rgba(0,0,0,0.2) 100%)",
        titleColor: "#a855f7",
        accentColor: "#06b6d4",
        titleFont: "Bebas Neue",
    },
};

// Fallback para plantillas que no tienen entry en CARD_CONFIG (ej. builder-based)
const FALLBACK_CONFIG = {
    photo: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=600&h=750&fit=crop",
    gradient: "linear-gradient(to top, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.2) 100%)",
    titleColor: "#ffffff",
    accentColor: "#facc15",
    titleFont: "Bebas Neue",
};

export default function TemplateCard({ template }: TemplateCardProps) {
    const config = CARD_CONFIG[template.id] ?? FALLBACK_CONFIG;

    // Las plantillas builder no tienen layers; usar el título como fallback
    const allLayers: TemplateLayer[] = template.layers ?? [];
    const textLayers = allLayers.filter(l => l.type === "text") as Extract<TemplateLayer, { type: "text" }>[];
    const titleLayer = textLayers.length
        ? textLayers.reduce((a, b) => (a.fontSize > b.fontSize ? a : b), textLayers[0])
        : undefined;
    const secondTitle = textLayers.filter(l => l.id !== titleLayer?.id && l.fontSize >= 40).slice(0, 1)[0];
    const subtitleLayer = textLayers.filter(l => l.fontSize >= 18 && l.fontSize < 40 && l.id !== titleLayer?.id).slice(0, 1)[0];
    const dateLayer = textLayers.filter(l => l.fontSize < 18 && (l.text.includes("JUNIO") || l.text.includes("JULIO") || l.text.includes("AGOSTO") || l.text.toLowerCase().includes("jun") || l.text.toLowerCase().includes("jul"))).slice(0, 1)[0];
    const venueLayer = textLayers.filter(l => l.fontSize < 16 && l.id !== dateLayer?.id).slice(0, 1)[0];

    // Para plantillas builder, usar el título de la plantilla como fallback visual
    const displayTitle = titleLayer?.text ?? template.title;

    return (
        <div
            className="w-full relative overflow-hidden"
            style={{ aspectRatio: `${template.width} / ${template.height}` }}
        >
            {/* Foto de fondo */}
            <img
                src={config.photo}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
            />

            {/* Gradient overlay */}
            <div
                className="absolute inset-0"
                style={{ background: config.gradient }}
            />

            {/* Línea decorativa superior */}
            <div
                className="absolute left-5 right-5"
                style={{ top: "7%", height: "1px", background: config.accentColor, opacity: 0.6 }}
            />

            {/* Contenido */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-8 flex flex-col items-center gap-0.5">

                {/* Título principal */}
                <div
                    className="font-black text-center leading-none w-full"
                    style={{
                        color: config.titleColor,
                        fontSize: "clamp(2rem, 9vw, 3.2rem)",
                        fontFamily: config.titleFont,
                        textShadow: `0 2px 24px ${config.accentColor}88`,
                        letterSpacing: "0.02em",
                    }}
                >
                    {displayTitle}
                </div>

                {/* Segunda línea del título */}
                {secondTitle && (
                    <div
                        className="font-black text-center leading-none w-full"
                        style={{
                            color: config.accentColor,
                            fontSize: "clamp(1.6rem, 7vw, 2.6rem)",
                            fontFamily: config.titleFont,
                            letterSpacing: "0.02em",
                        }}
                    >
                        {secondTitle.text}
                    </div>
                )}

                {/* Subtítulo */}
                {subtitleLayer && (
                    <div
                        className="text-center mt-1"
                        style={{
                            color: subtitleLayer.color,
                            fontSize: "clamp(0.75rem, 3vw, 1rem)",
                            fontFamily: subtitleLayer.fontFamily,
                            opacity: 0.9,
                        }}
                    >
                        {subtitleLayer.text}
                    </div>
                )}

                {/* Separador */}
                <div
                    className="my-1.5"
                    style={{ width: "35%", height: "1px", background: config.accentColor, opacity: 0.5 }}
                />

                {/* Fecha */}
                {dateLayer && (
                    <div
                        className="text-center font-bold"
                        style={{
                            color: "#ffffff",
                            fontSize: "clamp(0.6rem, 2.5vw, 0.8rem)",
                            fontFamily: "Montserrat, sans-serif",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {dateLayer.text}
                    </div>
                )}

                {/* Lugar */}
                {venueLayer && (
                    <div
                        className="text-center"
                        style={{
                            color: config.accentColor,
                            fontSize: "clamp(0.55rem, 2vw, 0.7rem)",
                            fontFamily: "Montserrat, sans-serif",
                            opacity: 0.85,
                        }}
                    >
                        {venueLayer.text}
                    </div>
                )}
            </div>

            {/* Línea decorativa inferior */}
            <div
                className="absolute left-5 right-5"
                style={{ bottom: "4%", height: "1px", background: config.accentColor, opacity: 0.4 }}
            />
        </div>
    );
}
