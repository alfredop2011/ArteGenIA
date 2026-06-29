"use client";

import { useState, useEffect } from "react";
import { X, Type } from "lucide-react";
import { TEXT_PRESETS, type TextPreset, type TextBlock } from "@/lib/textPresets";

/**
 * Panel "Texto" — botón "Texto vacío" + grid de combos profesionales
 * pre-diseñados. Cada card muestra TODOS los bloques del preset
 * miniaturizados con su layout y tipografía real (no solo el título).
 *
 * v3: convertido de modal centrado a panel lateral anclado a la
 * izquierda (estilo Polotno). En desktop ocupa una columna fija al
 * lado del sidebar; en mobile se renderiza como bottom sheet
 * fullscreen. Backdrop sutil que cierra al clickar fuera.
 *
 * Compartido entre editor desktop y mobile. El padre maneja el insert
 * vía el callback onPick (tiene acceso al fabricRef y el canvasSize
 * del editor concreto).
 */

interface Props {
    onPickEmpty: () => void;
    onPickPreset: (preset: TextPreset) => void;
    onClose: () => void;
}

const CATEGORIES: Array<{ id: TextPreset["category"] | "all"; label: string }> = [
    { id: "all",    label: "Todos" },
    { id: "header", label: "Encabezados" },
    { id: "evento", label: "Eventos" },
    { id: "dj",     label: "DJ · Lineup" },
    { id: "promo",  label: "Promos" },
    { id: "info",   label: "Info" },
];

export default function TextPresetsModal({ onPickEmpty, onPickPreset, onClose }: Props) {
    const [activeCat, setActiveCat] = useState<TextPreset["category"] | "all">("all");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const presets = activeCat === "all"
        ? TEXT_PRESETS
        : TEXT_PRESETS.filter(p => p.category === activeCat);

    // Desktop: panel anclado a la izquierda (ancho fijo). Mobile: bottom
    // sheet fullscreen. En ambos casos backdrop sutil que cierra al click.
    const panelClasses = isMobile
        ? "absolute inset-x-0 bottom-0 top-16 rounded-t-2xl"
        : "absolute left-0 top-0 bottom-0 w-[380px] rounded-r-2xl";

    return (
        <div className="fixed inset-0 z-[100] bg-black/40"
             onClick={onClose}>
            <div className={`${panelClasses} bg-[#16161e] border border-white/10 shadow-2xl flex flex-col overflow-hidden`}
                 onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-purple-400" strokeWidth={2.2} />
                        <h2 className="text-white font-semibold text-sm">Añadir texto</h2>
                    </div>
                    <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            aria-label="Cerrar">
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>

                {/* Botón "Texto vacío" */}
                <div className="px-4 pt-3 shrink-0">
                    <button
                        onClick={() => { onPickEmpty(); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-fuchsia-600/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Type className="w-4 h-4 text-purple-300" strokeWidth={2} />
                        </div>
                        <div className="text-left flex-1">
                            <div className="text-white text-[13px] font-semibold">Texto vacío</div>
                            <div className="text-gray-400 text-[10px]">Empieza desde cero</div>
                        </div>
                    </button>
                </div>

                {/* Tabs categorías */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                    <div className="text-gray-500 text-[9px] uppercase tracking-wider font-semibold mb-1.5 px-0.5">
                        Combos profesionales
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap ${
                                    activeCat === cat.id
                                        ? "bg-purple-500 text-white"
                                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de presets — 1 columna en panel desktop (más espacio
                    para ver el layout), 2 columnas en mobile bottom sheet */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className={isMobile ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2.5"}>
                        {presets.map(preset => (
                            <PresetCard
                                key={preset.id}
                                preset={preset}
                                horizontal={!isMobile}
                                onClick={() => { onPickPreset(preset); onClose(); }}
                            />
                        ))}
                    </div>
                    {presets.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-8">
                            No hay presets en esta categoría aún
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Card con preview REAL del preset — renderiza TODOS los bloques con
 * su tipografía, tamaño relativo, alineación y spacing real, escalados
 * para entrar en el card. Esto le da al usuario una idea fiel de qué
 * va a obtener (a diferencia de mostrar solo el bloque dominante).
 *
 * Escala calculada para que el preset (típicamente ~1080×600px en
 * canvas) entre en un card de ~330×140px (desktop) o ~150×190px
 * (mobile 2-col).
 */
function PresetCard({
    preset, horizontal, onClick,
}: {
    preset: TextPreset;
    horizontal: boolean;
    onClick: () => void;
}) {
    // Escala fuente real → card. En desktop panel ancho ~330, escala 0.18.
    // En mobile card ~150, escala 0.13.
    const scale = horizontal ? 0.18 : 0.13;

    // Calculamos el yOffset relativo total para distribuir verticalmente.
    // El primer bloque queda en yOffsetPx=0 (top del card content area).
    const allLeft = preset.blocks.every(b => b.textAlign === "left");

    return (
        <button
            onClick={onClick}
            className={`group relative ${horizontal ? "h-[155px]" : "aspect-[4/5]"} rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-purple-400/50 transition-all overflow-hidden flex flex-col`}>
            {/* Área de preview */}
            <div className={`flex-1 ${allLeft ? "px-3 pt-2" : "p-2"} overflow-hidden relative`}>
                <div className="relative" style={{ textAlign: allLeft ? "left" : "center" }}>
                    {preset.blocks.map((block, i) => (
                        <PreviewBlock
                            key={i}
                            block={block}
                            scale={scale}
                            isFirst={i === 0}
                            prevOffset={i > 0 ? preset.blocks[i - 1].yOffsetPx : 0}
                        />
                    ))}
                </div>
            </div>
            {/* Nombre del preset */}
            <div className="px-2 py-1.5 text-[10px] text-gray-400 text-center font-medium truncate border-t border-white/5 bg-black/30 shrink-0">
                {preset.name}
            </div>
        </button>
    );
}

function PreviewBlock({
    block, scale, isFirst, prevOffset,
}: {
    block: TextBlock;
    scale: number;
    isFirst: boolean;
    prevOffset: number;
}) {
    const fontSize = Math.max(7, block.fontSize * scale);
    // Spacing entre bloques: convertir el yOffset real a margin-top
    // escalado. El primer bloque sin margin (queda pegado arriba).
    const marginTop = isFirst ? 0 : Math.max(2, (block.yOffsetPx - prevOffset) * scale * 0.5);

    return (
        <div
            style={{
                fontFamily: block.fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: block.fontWeight,
                fontStyle: block.fontStyle ?? "normal",
                color: block.fill,
                textAlign: block.textAlign,
                letterSpacing: block.letterSpacing
                    ? `${block.letterSpacing / 1000}em`
                    : undefined,
                lineHeight: block.lineHeight ?? 1.16,
                marginTop: `${marginTop}px`,
                whiteSpace: "pre-line",
                overflow: "hidden",
            }}>
            {block.text}
        </div>
    );
}
