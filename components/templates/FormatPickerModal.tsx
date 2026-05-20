"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import type { Template } from "@/data/templates";
import { FORMATS, type FormatId } from "@/data/formats";

type Props = {
    template: Template;
    onClose: () => void;
};

/**
 * Modal mostrado al hacer click en "Usar plantilla" cuando una plantilla tiene
 * más de una variante de formato. Si solo tiene una, el caller debería saltar
 * directo al editor sin abrir este modal.
 */
export default function FormatPickerModal({ template, onClose }: Props) {
    const [selectedFormat, setSelectedFormat] = useState<FormatId>(template.variants[0].format);

    // Cerrar con Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl bg-[#0f0f1a] border border-white/10 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
                    <div>
                        <h2 className="text-lg font-bold text-white">Elige el formato</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Esta plantilla está disponible en {template.variants.length} {template.variants.length === 1 ? "formato" : "formatos"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="rounded-lg p-1 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X size={18} strokeWidth={1.8} />
                    </button>
                </div>

                {/* Variantes */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                    {template.variants.map((variant) => {
                        const fmt = FORMATS[variant.format];
                        const Icon = fmt.icon;
                        const isSelected = selectedFormat === variant.format;
                        return (
                            <button
                                key={variant.format}
                                onClick={() => setSelectedFormat(variant.format)}
                                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                                    isSelected
                                        ? "border-purple-500 bg-purple-500/15"
                                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        isSelected ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-gray-400"
                                    }`}
                                >
                                    <Icon size={18} strokeWidth={1.8} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-200"}`}>
                                        {fmt.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {fmt.subtitle}
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="text-purple-300 text-xs font-medium shrink-0">Seleccionado</div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                    <Link
                        href={`/editor/${template.id}?format=${selectedFormat}`}
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-3 text-sm font-bold text-white transition-colors"
                    >
                        Continuar al editor
                        <ArrowRight size={15} strokeWidth={2} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
