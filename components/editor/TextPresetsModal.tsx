"use client";

import { useState } from "react";
import { X, Type } from "lucide-react";
import { TEXT_PRESETS, type TextPreset } from "@/lib/textPresets";

/**
 * Modal de "Texto" — muestra 1 botón "Texto vacío" + grid de 10 combos
 * profesionales pre-diseñados. Click en un preset → inserta el grupo de
 * IText al canvas y cierra el modal.
 *
 * Compartido entre editor desktop y mobile (responsive con Tailwind).
 * El padre maneja el insert vía el callback onPick (tiene acceso al
 * fabricRef y el canvasSize del editor concreto).
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

    const presets = activeCat === "all"
        ? TEXT_PRESETS
        : TEXT_PRESETS.filter(p => p.category === activeCat);

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
             onClick={onClose}>
            <div className="bg-[#16161e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                 onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        <h2 className="text-white font-semibold text-base">Añadir texto</h2>
                    </div>
                    <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            aria-label="Cerrar">
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Botón "Texto vacío" */}
                <div className="px-5 pt-4 shrink-0">
                    <button
                        onClick={() => { onPickEmpty(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-fuchsia-600/30 transition-all group">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Type className="w-4 h-4 text-purple-300" strokeWidth={2} />
                        </div>
                        <div className="text-left flex-1">
                            <div className="text-white text-sm font-semibold">Texto vacío</div>
                            <div className="text-gray-400 text-[11px]">Empieza desde cero con un texto editable</div>
                        </div>
                    </button>
                </div>

                {/* Tabs categorías */}
                <div className="px-5 pt-4 pb-2 shrink-0">
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">
                        Combos profesionales
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                                    activeCat === cat.id
                                        ? "bg-purple-500 text-white"
                                        : "bg-white/5 text-gray-300 hover:bg-white/10"
                                }`}>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de presets */}
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                    <div className="grid grid-cols-2 gap-3">
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
 * Preview visual de un preset — renderiza el bloque dominante (mayor
 * fontSize) con la fuente real escalada al tamaño del card. Da una idea
 * fiable del aspecto sin necesidad de hacer un canvas en miniatura.
 */
function PresetCard({ preset, onClick }: { preset: TextPreset; onClick: () => void }) {
    const dominant = preset.blocks.reduce((a, b) => (b.fontSize > a.fontSize ? b : a));
    // Escala la fuente del preset (ej. 180px) a algo legible en el card
    // (~22-32px). Mantiene la tipografía y peso para que el preview sea fiel.
    const previewSize = Math.min(32, Math.max(14, dominant.fontSize / 6));

    return (
        <button
            onClick={onClick}
            className="group relative aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-purple-400/50 transition-all flex flex-col items-center justify-center px-3 py-2 overflow-hidden">
            <div
                className="text-white text-center leading-tight"
                style={{
                    fontFamily: dominant.fontFamily,
                    fontSize: previewSize,
                    fontWeight: dominant.fontWeight,
                    fontStyle: dominant.fontStyle ?? "normal",
                    letterSpacing: dominant.letterSpacing
                        ? `${dominant.letterSpacing / 1000}em`
                        : undefined,
                    color: dominant.fill,
                }}>
                {dominant.text.length > 14 ? dominant.text.slice(0, 13) + "…" : dominant.text}
            </div>
            <div className="absolute bottom-1.5 left-2 right-2 text-[10px] text-gray-400 text-center font-medium truncate">
                {preset.name}
            </div>
        </button>
    );
}
