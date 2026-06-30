"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
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

/**
 * Categorías por OBJETIVO del usuario (Jobs-To-Be-Done) — feedback v9
 * del user: "¿PARA QUÉ LO NECESITAS? Encuentra más rápido".
 *
 * Mucho mejor UX que agrupar por TIPO de contenido (eventos, DJ, info).
 * El user no piensa "necesito un preset de DJ", piensa "necesito
 * anunciar a mis artistas" o "necesito vender entradas".
 */
const CATEGORIES: Array<{ id: TextPreset["category"] | "all"; label: string }> = [
    { id: "all",                label: "Todas" },
    // "Anunciar artistas" primero ("ponlos de primero", feedback usuario).
    { id: "anunciar-artistas",  label: "Anunciar artistas" },
    { id: "promo-evento",       label: "Promocionar evento" },
    { id: "vender-entradas",    label: "Vender entradas" },
    { id: "lanzamiento",        label: "Lanzamiento" },
    { id: "captar-alumnos",     label: "Captar alumnos" },
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
                    <div className="mb-1.5 px-0.5">
                        <div className="text-white text-[11px] font-bold">¿Para qué lo necesitas?</div>
                        <div className="text-gray-500 text-[9px]">Encuentra más rápido</div>
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

                {/* Grid de presets — SIEMPRE 2 columnas (estilo Polotno
                    reference, feedback v4). En mobile cards más altas para
                    que el preview multi-bloque se lea bien. */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2.5">
                        {presets.map(preset => (
                            <PresetCard
                                key={preset.id}
                                preset={preset}
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
 * Card con preview REAL del preset. La clave (feedback Polotno): NO se
 * miniaturiza el canvas entero con una escala fija — se renderiza el
 * GRUPO de texto a su tamaño natural (tipografía/posiciones reales del
 * Fabric), se MIDE su bounding box y se aplica un `fit-to-box` con
 * padding para que LLENE el thumbnail y quede centrado, como Polotno.
 *
 * Así cada preset luce como una pieza tipográfica balanceada y no como
 * una captura perdida en una tarjeta vacía. La escala es por-preset
 * (depende de su bbox real), no un 0.13 fijo para todos.
 */
function PresetCard({
    preset, onClick,
}: {
    preset: TextPreset;
    onClick: () => void;
}) {
    const areaRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    // fit = bounding box natural medido (w×h) + escala para entrar centrado.
    const [fit, setFit] = useState<{ scale: number; w: number; h: number } | null>(null);

    useLayoutEffect(() => {
        const area = areaRef.current, group = groupRef.current;
        if (!area || !group) return;
        const PAD = 12;
        const measure = () => {
            const kids = Array.from(group.children) as HTMLElement[];
            if (!kids.length) return;
            // Bounding box real del grupo: ancho = línea más ancha;
            // alto = base del bloque más bajo (top absoluto + su alto).
            let w = 0, h = 0;
            for (const k of kids) {
                w = Math.max(w, k.offsetWidth);
                h = Math.max(h, k.offsetTop + k.offsetHeight);
            }
            if (!w || !h) return;
            const aw = area.clientWidth - PAD * 2;
            const ah = area.clientHeight - PAD * 2;
            // min(ratios) = fit-to-box; cap a 1 para no ampliar más allá de
            // su tamaño natural (evita un bloque diminuto gigante/borroso).
            const scale = Math.min(aw / w, ah / h, 1);
            setFit({ scale, w, h });
        };
        measure();
        // Remedir si cambia el tamaño del área (responsive/mobile).
        const ro = new ResizeObserver(measure);
        ro.observe(area);
        // Y cuando carguen las fuentes (cambian las métricas → el bbox real).
        const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
        fonts?.ready?.then(measure).catch(() => {});
        return () => ro.disconnect();
    }, [preset]);

    return (
        <button
            onClick={onClick}
            className="group relative aspect-[3/4] rounded-xl bg-white border border-gray-200 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
            {/* Área de preview — el grupo se MIDE y se escala (fit-to-box) para
                llenar y centrarse. No es una miniatura del artboard entero. */}
            <div ref={areaRef}
                 className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-white to-gray-50">
                <div
                    ref={groupRef}
                    style={{
                        position: "relative",
                        flex: "none",
                        width: fit ? fit.w : "auto",
                        height: fit ? fit.h : "auto",
                        transform: fit ? `scale(${fit.scale})` : undefined,
                        transformOrigin: "center",
                        // Oculto hasta medir → sin flash de texto a tamaño natural.
                        visibility: fit ? "visible" : "hidden",
                    }}>
                    {preset.blocks.map((block, i) => (
                        <PreviewBlock key={i} block={block} measured={!!fit} />
                    ))}
                </div>
            </div>
            {/* Nombre del preset — etiqueta FUERA del preview, abajo, para no
                arruinar la composición (feedback #7). */}
            <div className="px-2 py-1.5 text-[9px] text-gray-500 text-center font-semibold truncate border-t border-gray-100 bg-gray-50 shrink-0">
                {preset.name}
            </div>
        </button>
    );
}

/**
 * Adapta el color del preview para que se vea sobre fondo blanco de la
 * card. Los fills blancos del preset (#ffffff) se invierten a negro
 * legible. Otros colores (dorado, rojo, etc.) se mantienen porque son
 * decisión intencional del diseño.
 */
function previewColorFor(fill: string): string {
    const f = fill.toLowerCase();
    if (f === "#ffffff" || f === "#fff") return "#0e0e14";
    return fill;
}

/**
 * Bloque del preset renderizado a TAMAÑO NATURAL (px reales del Fabric),
 * posicionado por su yOffsetPx absoluto. El escalado lo hace el grupo
 * (transform: scale), así toda la tipografía se preserva con fidelidad.
 *
 * - measured=false (1ª pasada): width:max-content → offsetWidth = línea
 *   más ancha real, para medir el bbox.
 * - measured=true: width:100% del grupo ya dimensionado → textAlign
 *   (left/center/right) se respeta dentro del bounding box.
 */
function PreviewBlock({ block, measured }: { block: TextBlock; measured: boolean }) {
    return (
        <div
            style={{
                position: "absolute",
                top: `${block.yOffsetPx}px`,
                left: 0,
                width: measured ? "100%" : "max-content",
                fontFamily: block.fontFamily,
                fontSize: `${block.fontSize}px`,
                fontWeight: block.fontWeight,
                fontStyle: block.fontStyle ?? "normal",
                color: previewColorFor(block.fill),
                textAlign: block.textAlign,
                letterSpacing: block.letterSpacing
                    ? `${block.letterSpacing / 1000}em`
                    : undefined,
                lineHeight: block.lineHeight ?? 1.16,
                whiteSpace: "pre",
            }}>
            {block.text}
        </div>
    );
}
