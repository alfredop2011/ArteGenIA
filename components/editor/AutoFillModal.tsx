"use client";

/**
 * AutoFillModal — pega texto libre (típicamente de ChatGPT) y la IA mapea
 * los datos a las capas de texto de la plantilla manteniendo el estilo.
 *
 * Flow:
 *   1. Usuario pega texto en el textarea
 *   2. Click "Analizar y rellenar" → POST /api/auto-fill-template
 *   3. La IA devuelve { customId: nuevo_texto } para las capas detectadas
 *   4. Mostramos preview "antes/después" antes de aplicar
 *   5. Usuario click "Aplicar todos" → callback al editor con el mapping
 *
 * Coste: 2 créditos por uso. Refund automático si falla.
 */

import { useState } from "react";
import { Loader2, Sparkles, X, ArrowRight, Check, AlertCircle } from "lucide-react";

type Props = {
    projectId: string;
    /** Lista actual de capas de texto del canvas. La usamos para mostrar
     *  el preview "antes" antes de aplicar el mapping. */
    currentTexts: Array<{ customId: string; text: string }>;
    onClose: () => void;
    /** Callback al confirmar — el editor itera el mapping y aplica los
     *  cambios al canvas. */
    onApply: (mapping: Record<string, string>) => void;
};

type Stage = "input" | "loading" | "preview" | "error";

export default function AutoFillModal({ projectId, currentTexts, onClose, onApply }: Props) {
    const [stage, setStage] = useState<Stage>("input");
    const [text, setText] = useState("");
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // Filtro: solo mostrar diffs reales (no incluir capas donde el texto
    // nuevo es idéntico al antiguo — la IA a veces devuelve sin cambios).
    const realChanges = (() => {
        const currentByCustomId = new Map(currentTexts.map(t => [t.customId, t.text]));
        return Object.entries(mapping)
            .map(([customId, newText]) => ({
                customId,
                oldText: currentByCustomId.get(customId) ?? "",
                newText,
            }))
            .filter(c => c.oldText.trim() !== c.newText.trim());
    })();

    const submit = async () => {
        if (text.trim().length === 0) {
            setError("Pega aquí la info del evento antes de continuar");
            return;
        }
        setStage("loading");
        setError(null);
        try {
            const res = await fetch("/api/auto-fill-template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: projectId, user_text: text }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "No se pudo procesar el texto");
            }
            setMapping(data.mapping as Record<string, string>);
            setStage("preview");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
            setStage("error");
        }
    };

    const apply = () => {
        onApply(mapping);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl p-6 relative max-h-[85vh] flex flex-col"
                style={{
                    background: "#1a1a24",
                    border: "1px solid rgba(168,85,247,0.30)",
                    boxShadow: "0 0 40px rgba(168,85,247,0.20), 0 20px 60px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="mb-4 pr-8">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" /> Rellenar plantilla con IA
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        Pega aquí la info del evento (de ChatGPT, un email, una nota...) y la IA mapeará cada dato a su capa correcta manteniendo el estilo.
                    </p>
                </div>

                {/* ── STAGE: INPUT ──────────────────────────────────── */}
                {stage === "input" && (
                    <>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={`Ejemplo:\n\nBootcamp de Bachata 25-26 octubre\nProfes: Isa & Ale (Sensual) + Damián (Técnica)\nSábado: 10:00 base, 13:00 almuerzo, 16:00 figuras, 19:00 social\nDomingo: 10:00 musicalidad, 13:00 almuerzo, 16:00 sensual, 18:00 cierre\nPrecio: 150€ (early bird 130€ hasta 10 oct)\nReservas: bootcamp@escueladelsol.es`}
                            rows={12}
                            maxLength={8000}
                            className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:outline-none font-mono leading-relaxed resize-none"
                        />
                        {error && (
                            <div className="mt-3 px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400">
                                {error}
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                            <p className="text-[11px] text-gray-500">
                                {text.length}/8000 caracteres · <span className="text-purple-300 font-bold">2 créditos</span>
                            </p>
                            <button
                                onClick={() => void submit()}
                                disabled={text.trim().length === 0}
                                className="px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg shadow-purple-500/30 disabled:opacity-40 flex items-center gap-2"
                                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                            >
                                <Sparkles size={14} /> Analizar y rellenar
                            </button>
                        </div>
                    </>
                )}

                {/* ── STAGE: LOADING ────────────────────────────────── */}
                {stage === "loading" && (
                    <div className="py-16 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-white">Analizando tu texto...</p>
                            <p className="text-xs text-gray-500 mt-1">Claude está mapeando cada dato a su capa. Suele tardar 5-10s.</p>
                        </div>
                    </div>
                )}

                {/* ── STAGE: PREVIEW (antes/después) ────────────────── */}
                {stage === "preview" && (
                    <>
                        {realChanges.length === 0 ? (
                            <div className="py-10 text-center">
                                <AlertCircle size={28} className="mx-auto text-amber-400 mb-3" />
                                <p className="text-sm text-white font-bold">No detectamos cambios aplicables</p>
                                <p className="text-xs text-gray-500 mt-1">El texto no coincidía con ninguna capa. Tu crédito fue devuelto.</p>
                            </div>
                        ) : (
                            <>
                                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs mb-3">
                                    ✓ {realChanges.length} cambio{realChanges.length === 1 ? "" : "s"} detectado{realChanges.length === 1 ? "" : "s"}. Revisa antes de aplicar.
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
                                    {realChanges.map((c, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl p-3"
                                            style={{
                                                background: "rgba(255,255,255,0.04)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                            }}
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                                {c.customId}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-gray-500">Antes</p>
                                                    <p className="text-sm text-gray-400 line-through truncate">{c.oldText}</p>
                                                </div>
                                                <ArrowRight size={16} className="text-purple-400 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-emerald-400">Después</p>
                                                    <p className="text-sm text-white font-bold truncate">{c.newText}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                                    <button
                                        onClick={() => setStage("input")}
                                        className="px-3 py-2 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                                    >
                                        ← Editar texto
                                    </button>
                                    <button
                                        onClick={apply}
                                        className="px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg shadow-purple-500/30 flex items-center gap-2"
                                        style={{ background: "linear-gradient(135deg,#a855f7,#10b981)" }}
                                    >
                                        <Check size={14} /> Aplicar {realChanges.length} cambio{realChanges.length === 1 ? "" : "s"}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ── STAGE: ERROR ─────────────────────────────────── */}
                {stage === "error" && (
                    <div className="py-10 text-center">
                        <AlertCircle size={28} className="mx-auto text-red-400 mb-3" />
                        <p className="text-sm text-white font-bold">No se pudo procesar</p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">{error}</p>
                        <button
                            onClick={() => setStage("input")}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-colors"
                        >
                            Volver a intentar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
