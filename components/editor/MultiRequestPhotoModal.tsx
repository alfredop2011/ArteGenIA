"use client";

/**
 * MultiRequestPhotoModal — wizard "Solicitar fotos" para varios colaboradores
 * a la vez. Detecta todas las capas image del flyer en el momento del click,
 * genera N invites de golpe (uno por capa) y muestra una lista de links +
 * WhatsApp para que el organizador los reparta.
 *
 * Flow:
 *   1. Recibe array de capas detectadas del canvas (LayerInput[])
 *   2. Por cada capa, el user puede opcionalmente poner un nombre/rol
 *      (ej. "Bailarín 1", "DJ Axis", "Marca patrocinador") — se usa solo
 *      para personalizar el mensaje WhatsApp pre-relleno
 *   3. Click "Generar todos los links" → POST a /api/collaborator-invites/bulk
 *   4. Backend devuelve N tokens (reutiliza los pendientes existentes)
 *   5. Cada item muestra link único + botón "Copiar" + botón "WhatsApp"
 *
 * Si el user vuelve a abrir el wizard, los links pendientes se reutilizan
 * (no se generan duplicados) — perfecto para añadir capas después y volver
 * sin enviar dos links a la misma persona.
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2, Copy, Check, MessageCircle, X, Sparkles } from "lucide-react";

export type LayerInput = {
    customId: string;
    /** thumbnail base64 opcional para identificar visualmente la capa */
    thumbnail?: string | null;
    /** label sugerido (ej. "dj-photo" → "DJ photo"). Editable por el user. */
    suggestedRole?: string;
};

type Invite = {
    token: string;
    target_layer_id: string;
    expiresAt: string;
    reused: boolean;
};

type Props = {
    projectId: string;
    projectName?: string | null;
    layers: LayerInput[];
    onClose: () => void;
};

export default function MultiRequestPhotoModal({ projectId, projectName, layers, onClose }: Props) {
    // Roles editables por el user. Indexado por customId. Empieza con el
    // suggestedRole de cada capa.
    const [roles, setRoles] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        for (const l of layers) initial[l.customId] = l.suggestedRole ?? "";
        return initial;
    });

    const [generating, setGenerating] = useState(false);
    const [invites, setInvites] = useState<Invite[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Tracking de qué links se copiaron recientemente (feedback visual breve)
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const generate = async () => {
        if (layers.length === 0) {
            setError("No se detectaron capas de imagen en el flyer");
            return;
        }
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch("/api/collaborator-invites/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId,
                    layer_ids: layers.map(l => l.customId),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudieron generar los links");
            setInvites(data.invites as Invite[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
        } finally {
            setGenerating(false);
        }
    };

    // Auto-generar al abrir si ya hay capas (UX más rápido — el user verá
    // los links de inmediato sin tener que pulsar otro botón).
    useEffect(() => {
        if (layers.length > 0 && invites === null && !generating) {
            void generate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const inviteByLayer = useMemo(() => {
        const map = new Map<string, Invite>();
        if (invites) for (const i of invites) map.set(i.target_layer_id, i);
        return map;
    }, [invites]);

    const linkFor = (token: string) =>
        typeof window !== "undefined" ? `${window.location.origin}/upload/${token}` : "";

    const copy = async (token: string) => {
        const url = linkFor(token);
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(curr => (curr === token ? null : curr)), 2000);
        } catch { /* clipboard puede fallar */ }
    };

    const whatsappLink = (token: string, role: string) => {
        const url = linkFor(token);
        const flyerLabel = projectName ? `del flyer "${projectName}"` : "del flyer";
        const roleLabel = role.trim() ? ` (${role.trim()})` : "";
        const msg = encodeURIComponent(
            `¡Hola${roleLabel}! Necesito tu foto para el diseño ${flyerLabel}. Súbela aquí (se coloca sola en su sitio): ${url}`,
        );
        return `https://wa.me/?text=${msg}`;
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
                    background: "rgba(15,15,25,0.98)",
                    border: "1px solid rgba(168,85,247,0.30)",
                    boxShadow: "0 0 40px rgba(168,85,247,0.20), 0 20px 60px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="mb-5 pr-8">
                    <h2 className="text-xl font-black mb-1 text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" /> Solicitar fotos a colaboradores
                    </h2>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        {layers.length} capa{layers.length === 1 ? "" : "s"} de imagen detectadas en este flyer. Cada link va a su capa específica — comparte cada uno con la persona correcta.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400">
                        {error}
                    </div>
                )}

                {layers.length === 0 && (
                    <div className="py-10 text-center text-sm text-gray-500">
                        No hay capas de imagen en este flyer. Añade alguna desde el editor (Foto → Subir o reemplazar) e inténtalo de nuevo.
                    </div>
                )}

                {generating && invites === null && (
                    <div className="py-10 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        <p className="text-xs text-gray-500">Generando {layers.length} link{layers.length === 1 ? "" : "s"}...</p>
                    </div>
                )}

                {invites !== null && (
                    <div className="overflow-y-auto flex-1 -mx-2 px-2 space-y-2.5">
                        {layers.map((layer) => {
                            const inv = inviteByLayer.get(layer.customId);
                            const role = roles[layer.customId] ?? "";
                            return (
                                <div
                                    key={layer.customId}
                                    className="rounded-xl p-3 flex gap-3 items-start"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    {/* Thumbnail si está disponible, si no un placeholder */}
                                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 flex items-center justify-center">
                                        {layer.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={layer.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Sparkles size={16} className="text-purple-400/60" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={role}
                                            onChange={(e) => setRoles(prev => ({ ...prev, [layer.customId]: e.target.value }))}
                                            placeholder={layer.suggestedRole || "Nombre o rol (ej. Bailarín 1, DJ Axis)"}
                                            maxLength={60}
                                            className="w-full px-2 py-1.5 rounded-md text-xs bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-gray-600 focus:border-purple-500/40 focus:outline-none"
                                        />
                                        {inv && (
                                            <p className="text-[10px] text-gray-500 mt-1 truncate font-mono">
                                                {linkFor(inv.token)}
                                                {inv.reused && <span className="ml-2 text-emerald-400">· reutilizado</span>}
                                            </p>
                                        )}
                                    </div>

                                    {inv && (
                                        <div className="shrink-0 flex flex-col gap-1.5">
                                            <button
                                                onClick={() => void copy(inv.token)}
                                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all text-white"
                                                style={{
                                                    background: "rgba(255,255,255,0.06)",
                                                    border: "1px solid rgba(255,255,255,0.10)",
                                                }}
                                                title="Copiar link"
                                            >
                                                {copiedToken === inv.token ? (
                                                    <><Check size={11} className="text-emerald-400" /> Copiado</>
                                                ) : (
                                                    <><Copy size={11} /> Copiar</>
                                                )}
                                            </button>
                                            <a
                                                href={whatsappLink(inv.token, role)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-white transition-all hover:scale-[1.02]"
                                                style={{ background: "#25D366" }}
                                                title="Abrir en WhatsApp"
                                            >
                                                <MessageCircle size={11} />
                                                WhatsApp
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <p className="text-[10px] text-gray-500 pt-2 leading-relaxed">
                            Cuando un colaborador suba su foto, se colocará automáticamente en su capa y recibirás email + notificación.
                            Los links caducan en 7 días. Si vuelves a este wizard, los links pendientes se reutilizan (no se generan duplicados).
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
