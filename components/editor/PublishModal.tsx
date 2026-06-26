"use client";

/**
 * PublishModal — Modal único para "publicar" un flyer en redes sociales
 * + agenda de eventos externa (peligroficial.com).
 *
 * Reutilizable desde GeneratedEditor (desktop) y MobileEditorV3 (mobile).
 *
 * Flow:
 *   1. Al montarse, exporta el canvas a PNG (silencioso, sin descarga)
 *   2. Sube el PNG a /api/share-upload → obtiene URL pública /flyer/<id>
 *      con OG tags para preview en WhatsApp/Facebook/Telegram
 *   3. Muestra grid con opciones de compartir + Peligro Oficial
 *
 * Si el user no está autenticado: cierra y llama onRequireAuth (el padre
 * decide cómo abrir el modal de login).
 *
 * Peligro Oficial: abre https://peligroficial.com/eventos/nuevo?... con
 * query params pre-rellenados (title, image, date, city). Si el endpoint
 * final es distinto, ajustar PELIGRO_OFICIAL_URL_BASE más abajo.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import {
    Share2, X, MessageCircle, Send, Link2, Loader2, Check,
    Calendar, ExternalLink, AlertCircle,
} from "lucide-react";

// peligroficial.com es el mismo proyecto que ArteGenIA (multi-domain por
// host — ver proxy.ts). La página de crear evento es /organizador.
//
// Actualmente NO acepta query params para pre-rellenar el form (solo lee
// ?claim=<token>). Backlog: que /organizador lea ?title, ?image, ?date,
// ?city y los pre-rellene en el form de creación. Cuando esté listo,
// los params que mandamos abajo se aplicarán automáticamente.
//
// Mientras tanto, copiamos la URL del flyer al portapapeles al click para
// que el organizador solo tenga que pegar.
const PELIGRO_OFICIAL_URL_BASE = "https://peligroficial.com/organizador";

type ExportFn = () => Promise<string | null>;

type Props = {
    /** Función que exporta el canvas a dataURL PNG. Si no hay canvas listo
     *  o el user no está autenticado, devolver null. */
    exportPng: ExportFn;
    /** Título visible del flyer (para mostrar en preview y URL share). */
    flyerTitle: string;
    /** Opcional — metadata del evento para pre-rellenar Peligro Oficial.
     *  Si el flyer no tiene fecha/ciudad detectada, se pasan vacíos y el
     *  user los rellena en peligroficial.com directamente. */
    eventMetadata?: {
        date?: string;        // ISO YYYY-MM-DD o texto libre
        city?: string;
        category?: string;    // "fiesta" | "concierto" | "festival" | "club" | ...
        priceText?: string;   // "15€" o "Gratis"
    };
    /** Callback cuando el user no está autenticado y necesita login. */
    onRequireAuth: () => void;
    /** Callback al cerrar el modal. */
    onClose: () => void;
};

type Stage = "loading" | "ready" | "error";

// Iconos SVG inline para que el branding sea reconocible (no usamos
// lucide para Instagram/Facebook porque sus iconos genéricos no son
// reconocibles del todo).
const InstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
);

export default function PublishModal({
    exportPng, flyerTitle, eventMetadata, onRequireAuth, onClose,
}: Props) {
    const [stage, setStage] = useState<Stage>("loading");
    const [error, setError] = useState<string | null>(null);
    const [publicUrl, setPublicUrl] = useState<string | null>(null);
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [igInstrOpen, setIgInstrOpen] = useState(false);
    const hasUploadedRef = useRef(false);

    // Al montar: exportar PNG → subir a R2 → recibir publicUrl
    useEffect(() => {
        if (hasUploadedRef.current) return;
        hasUploadedRef.current = true;
        (async () => {
            try {
                const dataUrl = await exportPng();
                if (!dataUrl) {
                    // exportPng devuelve null cuando hay que pedir login
                    onRequireAuth();
                    onClose();
                    return;
                }
                setPreviewDataUrl(dataUrl);

                const res = await fetch("/api/share-upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageDataUrl: dataUrl, title: flyerTitle }),
                });
                const data = await res.json() as { publicUrl?: string; url?: string; error?: string };
                if (!res.ok) {
                    if (res.status === 401) {
                        onRequireAuth();
                        onClose();
                        return;
                    }
                    throw new Error(data.error ?? "No se pudo publicar el flyer");
                }
                const finalUrl = data.publicUrl || data.url;
                if (!finalUrl) throw new Error("La URL pública no llegó");
                setPublicUrl(finalUrl);
                setStage("ready");
            } catch (e) {
                console.error("[publish]", e);
                setError(e instanceof Error ? e.message : "Error desconocido");
                setStage("error");
            }
        })();
    }, [exportPng, flyerTitle, onRequireAuth, onClose]);

    // Mensaje base que acompaña al link en cada red social
    const message = `Mira el flyer que hice para "${flyerTitle}" con ArteGenIA 🎨`;
    const credit = "Creado con ArteGenIA — artegenia.com";

    const shareTo = useCallback((target: "whatsapp" | "facebook" | "telegram") => {
        if (!publicUrl) return;
        const text = `${message}\n\n${credit}`;
        let href = "";
        switch (target) {
            case "whatsapp":
                href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${publicUrl}`)}`;
                break;
            case "facebook":
                // Sharer ignora 'quote' desde 2018 — solo crawler-fetches OG del URL.
                href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
                break;
            case "telegram":
                href = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(text)}`;
                break;
        }
        window.open(href, "_blank", "noopener,noreferrer");
    }, [publicUrl, message, credit]);

    const copyLink = useCallback(async () => {
        if (!publicUrl) return;
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback execCommand (Safari iOS < 13.4)
            const ta = document.createElement("textarea");
            ta.value = publicUrl;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); } catch { /* silent */ }
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [publicUrl]);

    const [peligroLoading, setPeligroLoading] = useState(false);
    const [peligroCopied, setPeligroCopied] = useState(false);

    const publishToPeligro = useCallback(async () => {
        if (!publicUrl) return;
        setPeligroLoading(true);

        // 1) Copiamos la URL del flyer al portapapeles. Mientras
        //    /organizador no lea query params (backlog), el organizador
        //    pega la URL en el campo "Imagen" del form manualmente.
        try {
            await navigator.clipboard.writeText(publicUrl);
            setPeligroCopied(true);
            setTimeout(() => setPeligroCopied(false), 4000);
        } catch {
            // Fallback execCommand (Safari iOS < 13.4)
            const ta = document.createElement("textarea");
            ta.value = publicUrl;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand("copy"); } catch { /* silent */ }
            document.body.removeChild(ta);
            setPeligroCopied(true);
            setTimeout(() => setPeligroCopied(false), 4000);
        }

        // 2) Construimos URL con query params. Por ahora /organizador los
        //    ignora pero los enviamos para que cuando se implementen, todo
        //    funcione sin tocar ArteGenIA.
        const params = new URLSearchParams();
        params.set("title", flyerTitle);
        params.set("image", publicUrl);
        params.set("source", "artegenia");
        if (eventMetadata?.date) params.set("date", eventMetadata.date);
        if (eventMetadata?.city) params.set("city", eventMetadata.city);
        if (eventMetadata?.category) params.set("category", eventMetadata.category);
        if (eventMetadata?.priceText) params.set("price", eventMetadata.priceText);

        const url = `${PELIGRO_OFICIAL_URL_BASE}?${params.toString()}`;
        window.open(url, "_blank", "noopener,noreferrer");
        setPeligroLoading(false);
    }, [publicUrl, flyerTitle, eventMetadata]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[180] bg-black/70 backdrop-blur-md"
                onClick={onClose}
                aria-label="Cerrar"
            />

            {/* Modal centrado en desktop, bottom-sheet en mobile */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="publish-modal-title"
                className="fixed z-[190] left-1/2 -translate-x-1/2 w-full max-w-md
                           bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
                           rounded-t-3xl sm:rounded-3xl
                           safe-area-bottom flex flex-col max-h-[90vh]"
                style={{
                    background: "#13131f",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 0 40px rgba(168,85,247,0.20), 0 20px 60px rgba(0,0,0,0.6)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Grip mobile */}
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0 sm:hidden" />

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
                    <h2 id="publish-modal-title" className="text-base font-black text-white flex items-center gap-2">
                        <Share2 size={18} className="text-purple-300" />
                        Publicar flyer
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/[0.06] text-gray-300 hover:text-white flex items-center justify-center active:scale-95 transition"
                        aria-label="Cerrar"
                    >
                        <X size={16} strokeWidth={2.4} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
                    {/* Estado: loading */}
                    {stage === "loading" && (
                        <div className="py-8 flex flex-col items-center gap-3">
                            <Loader2 size={32} className="text-purple-400 animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">Preparando tu flyer...</p>
                                <p className="text-xs text-gray-500 mt-1">Subimos una copia para que se previsualice bien en cada red.</p>
                            </div>
                        </div>
                    )}

                    {/* Estado: error */}
                    {stage === "error" && (
                        <div className="py-8 flex flex-col items-center gap-3">
                            <AlertCircle size={28} className="text-red-400" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">No se pudo publicar</p>
                                <p className="text-xs text-gray-400 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-xs font-bold text-white border border-white/10"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}

                    {/* Estado: ready */}
                    {stage === "ready" && publicUrl && (
                        <>
                            {/* Preview thumbnail */}
                            {previewDataUrl && (
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewDataUrl}
                                        alt={flyerTitle}
                                        className="w-14 h-14 rounded-lg object-cover border border-white/10"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-white truncate">{flyerTitle}</div>
                                        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                                            <Check size={11} /> Listo para compartir
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* URL pública copiable */}
                            <button
                                onClick={() => void copyLink()}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition group"
                                title="Copiar enlace"
                            >
                                <Link2 size={14} className="text-purple-300 shrink-0" />
                                <code className="text-[11px] text-gray-300 truncate flex-1 text-left font-mono">
                                    {publicUrl}
                                </code>
                                <span className={`text-[10px] font-bold shrink-0 ${copied ? "text-emerald-400" : "text-gray-500 group-hover:text-purple-300"}`}>
                                    {copied ? "COPIADO ✓" : "COPIAR"}
                                </span>
                            </button>

                            {/* Redes sociales */}
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                                    Compartir en redes
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <PublishBtn
                                        bg="bg-emerald-500"
                                        icon={<MessageCircle size={20} strokeWidth={2.2} />}
                                        label="WhatsApp"
                                        onClick={() => shareTo("whatsapp")}
                                    />
                                    <PublishBtn
                                        bg="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400"
                                        icon={<InstagramIcon />}
                                        label="Instagram"
                                        onClick={() => setIgInstrOpen(true)}
                                    />
                                    <PublishBtn
                                        bg="bg-blue-600"
                                        icon={<FacebookIcon />}
                                        label="Facebook"
                                        onClick={() => shareTo("facebook")}
                                    />
                                    <PublishBtn
                                        bg="bg-sky-500"
                                        icon={<Send size={18} strokeWidth={2.2} />}
                                        label="Telegram"
                                        onClick={() => shareTo("telegram")}
                                    />
                                </div>
                            </div>

                            {/* Calendario eventos — Peligro Oficial */}
                            <div className="pt-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                                    Calendario de eventos
                                </div>
                                <button
                                    onClick={() => void publishToPeligro()}
                                    disabled={peligroLoading}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-white font-bold text-sm active:scale-[0.98] transition shadow-lg shadow-purple-500/20 disabled:opacity-70"
                                    style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Calendar size={18} strokeWidth={2.2} />
                                        Publicar en Peligro Oficial
                                    </span>
                                    {peligroLoading
                                        ? <Loader2 size={14} className="animate-spin opacity-80" />
                                        : <ExternalLink size={14} className="opacity-80" />}
                                </button>
                                {peligroCopied ? (
                                    <div className="mt-2 px-3 py-2 rounded-lg flex items-start gap-2 text-[11px] leading-snug"
                                        style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.30)", color: "#a7f3d0" }}>
                                        <Check size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                                        <span>
                                            <strong>URL copiada al portapapeles.</strong> Pégala en el campo &quot;Imagen del flyer&quot; del formulario.
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-500 leading-relaxed mt-2">
                                        Te abriremos el panel de organizador. Copiaremos la URL del flyer al portapapeles para que solo la pegues.
                                    </p>
                                )}
                            </div>

                            <p className="text-[10px] text-gray-600 leading-snug text-center pt-2">
                                Tu flyer se publica en una URL pública con preview optimizado para redes.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Instrucciones Instagram (no tiene web share publico) */}
            {igInstrOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center"
                    onClick={() => setIgInstrOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 flex flex-col gap-3 safe-area-bottom"
                        style={{ background: "#1c1c2a", border: "1px solid rgba(255,255,255,0.10)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                            <InstagramIcon />
                            Compartir en Instagram
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            Instagram no permite compartir desde la web de forma automática. Descarga el flyer y súbelo desde la app:
                        </p>
                        <ol className="text-xs text-gray-300 leading-relaxed space-y-1.5 pl-5 list-decimal">
                            <li>Descarga el flyer desde el botón <strong>Exportar</strong> arriba.</li>
                            <li>Abre Instagram → toca <strong>+</strong> arriba.</li>
                            <li>Elige <strong>Historia</strong> o <strong>Publicación</strong> y selecciona el flyer.</li>
                        </ol>
                        <button
                            onClick={() => {
                                // Deep link a la app si está instalada
                                window.location.href = "instagram://camera";
                                setTimeout(() => window.open("https://instagram.com", "_blank"), 800);
                            }}
                            className="mt-2 py-3 rounded-xl text-white font-bold text-sm active:scale-[0.98] flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg,#f472b6,#fb923c)" }}
                        >
                            <InstagramIcon />
                            Abrir Instagram
                        </button>
                        <button
                            onClick={() => setIgInstrOpen(false)}
                            className="py-2 rounded-xl bg-white/[0.06] text-gray-300 text-xs font-semibold"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Sub-componente: botón de red social ──────────────────────────────────

function PublishBtn({
    bg, icon, label, onClick,
}: {
    bg: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 active:scale-95 transition group"
        >
            <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                {icon}
            </div>
            <span className="text-[10px] text-gray-300 font-semibold">{label}</span>
        </button>
    );
}

// ─── Helper export: usado por GeneratedEditor para generar el dataURL ─────

/**
 * Exporta el canvas Fabric a PNG dataURL (alta calidad — mismo formato
 * que el flyer real). Devuelve null si el canvas no está listo.
 *
 * Usado como argumento exportPng del PublishModal. Centraliza la lógica
 * para que ambos editors (desktop + mobile) generen el mismo PNG.
 *
 * NO descarga el archivo — solo devuelve el dataURL para subirlo a R2.
 */
export function exportCanvasToPng(canvas: fabric.Canvas | null): string | null {
    if (!canvas) return null;
    try {
        // multiplier: 1 = tamaño real del canvas (que ya es 1080×1350 típico)
        return canvas.toDataURL({ format: "png", multiplier: 1, quality: 1 });
    } catch (e) {
        console.error("[exportCanvasToPng]", e);
        return null;
    }
}
