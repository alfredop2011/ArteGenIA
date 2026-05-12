"use client";

import { useState } from "react";

export type Format = {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
};

export const FORMATS: Format[] = [
    { id: "flyer",  name: "Flyer vertical",  description: "430 × 540 px · Cartel evento",    width: 430,  height: 540  },
    { id: "post",   name: "Post cuadrado",   description: "1080 × 1080 px · Instagram/FB",   width: 1080, height: 1080 },
    { id: "story",  name: "Historia",        description: "1080 × 1920 px · Stories/Reels",  width: 1080, height: 1920 },
    { id: "custom", name: "Personalizado",   description: "Tú eliges el tamaño",             width: 0,    height: 0    },
];

type Props = { onSelect: (width: number, height: number) => void };

export default function FormatSelector({ onSelect }: Props) {
    const [selected, setSelected] = useState("flyer");
    const [customW, setCustomW] = useState(800);
    const [customH, setCustomH] = useState(600);

    const confirm = () => {
        if (selected === "custom") {
            onSelect(Math.max(100, Math.min(3000, customW)), Math.max(100, Math.min(3000, customH)));
        } else {
            const f = FORMATS.find(f => f.id === selected)!;
            onSelect(f.width, f.height);
        }
    };

    // Preview box dimensions (max 48px)
    const previewBox = (w: number, h: number) => {
        const max = 44;
        if (w === h) return { width: max, height: max };
        if (w > h)   return { width: max, height: Math.round(max * h / w) };
        return             { width: Math.round(max * w / h), height: max };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 rounded-2xl bg-[#0f0f1a] border border-white/10 p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-1">Elige el formato</h2>
                <p className="text-sm text-gray-400 mb-5">El diseño de la plantilla se adaptará automáticamente</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    {FORMATS.map(fmt => {
                        const isSelected = selected === fmt.id;
                        const box = fmt.id !== "custom" ? previewBox(fmt.width, fmt.height) : null;
                        return (
                            <button
                                key={fmt.id}
                                onClick={() => setSelected(fmt.id)}
                                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center ${
                                    isSelected
                                        ? "border-purple-500 bg-purple-500/15 text-white"
                                        : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20 hover:bg-white/[0.06]"
                                }`}
                            >
                                <div className="h-12 flex items-center justify-center">
                                    {box ? (
                                        <div
                                            className={`rounded border-2 ${isSelected ? "border-purple-400 bg-purple-400/20" : "border-gray-500 bg-gray-700/30"}`}
                                            style={box}
                                        />
                                    ) : (
                                        <span className="text-2xl">📐</span>
                                    )}
                                </div>
                                <span className="text-sm font-semibold leading-tight">{fmt.name}</span>
                                <span className="text-xs text-gray-400 leading-tight">{fmt.description}</span>
                            </button>
                        );
                    })}
                </div>

                {selected === "custom" && (
                    <div className="flex items-center gap-3 mb-5 bg-white/[0.04] rounded-xl p-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Ancho (px)</label>
                            <input type="number" min={100} max={3000} value={customW}
                                onChange={e => setCustomW(Number(e.target.value))}
                                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                        </div>
                        <span className="text-gray-500 mt-5">×</span>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Alto (px)</label>
                            <input type="number" min={100} max={3000} value={customH}
                                onChange={e => setCustomH(Number(e.target.value))}
                                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                        </div>
                    </div>
                )}

                <button onClick={confirm}
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition-colors">
                    Crear diseño →
                </button>
            </div>
        </div>
    );
}
