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
import { Loader2, Copy, Check, MessageCircle, X, Sparkles, Plus, Image as ImageIcon, FolderOpen, CheckCircle2, Clock } from "lucide-react";

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

/** Invite "suelto" sin capa (foto va a Mis Recursos > Colaboradores). */
type GalleryInvite = {
    token: string;
    expiresAt: string;
    /** Rol/etiqueta opcional para personalizar mensaje WhatsApp */
    role: string;
};

type Props = {
    projectId: string;
    projectName?: string | null;
    layers: LayerInput[];
    onClose: () => void;
    /**
     * Callback opcional para que el editor añada un nuevo placeholder image
     * al canvas. Devuelve el customId asignado a la nueva capa. El wizard
     * lo añade a la lista y genera invite para él.
     * Si no se proporciona, el botón "Añadir slot vacío" no aparece.
     */
    onAddEmptySlot?: () => Promise<string | null>;
};

export default function MultiRequestPhotoModal({ projectId, projectName, layers, onClose, onAddEmptySlot }: Props) {
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
    // Invites a galería (sin slot): foto llega a Mis Recursos > Colaboradores.
    // El user los gestiona manualmente — útil cuando hay más artistas que
    // capas en el flyer.
    const [galleryInvites, setGalleryInvites] = useState<GalleryInvite[]>([]);
    const [addingGallery, setAddingGallery] = useState(false);
    const [addingSlot, setAddingSlot] = useState(false);
    // Status por token: si fue usado y por quién (artist_name). Se hidrata
    // al abrir el modal y se refresca cada 30s para que el usuario vea
    // llegar las fotos en directo sin tener que cerrar/reabrir.
    const [statusByToken, setStatusByToken] = useState<Record<string, { usedAt: string | null; collaboratorName: string | null }>>({});

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

    // Hidratar status de invites (usado/pendiente + nombre del colaborador).
    // Refresh cada 30s mientras el modal está abierto, para que el user vea
    // llegar las fotos en directo sin reabrir.
    useEffect(() => {
        let active = true;
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/collaborator-invites/by-project?project_id=${projectId}`);
                if (!res.ok || !active) return;
                const data = await res.json() as {
                    invites: Array<{
                        token: string;
                        used_at: string | null;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        collaborator: any;
                    }>;
                };
                const map: Record<string, { usedAt: string | null; collaboratorName: string | null }> = {};
                for (const inv of data.invites) {
                    map[inv.token] = {
                        usedAt: inv.used_at,
                        collaboratorName: (inv.collaborator?.artist_name as string | undefined) ?? null,
                    };
                }
                if (active) setStatusByToken(map);
            } catch { /* silent */ }
        };
        void fetchStatus();
        const interval = setInterval(() => { void fetchStatus(); }, 30_000);
        return () => { active = false; clearInterval(interval); };
    }, [projectId]);

    // Métricas de progreso para el header (X de N completadas + %)
    const progress = useMemo(() => {
        const total = (invites?.length ?? 0);
        if (total === 0) return { total: 0, done: 0, pct: 0 };
        let done = 0;
        for (const inv of invites ?? []) {
            if (statusByToken[inv.token]?.usedAt) done++;
        }
        return { total, done, pct: Math.round((done / total) * 100) };
    }, [invites, statusByToken]);

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

    /** Añade UN invite a galería (sin slot). La foto llegará a
     *  Mis Recursos > Colaboradores y el user la arrastra al flyer cuando
     *  quiera. POST al endpoint clásico (sin body = sin context). */
    const addGalleryInvite = async () => {
        setAddingGallery(true);
        setError(null);
        try {
            const res = await fetch("/api/collaborator-invites", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo generar el link");
            setGalleryInvites(prev => [
                ...prev,
                { token: data.token, expiresAt: data.expiresAt, role: "" },
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
        } finally {
            setAddingGallery(false);
        }
    };

    /** Pide al editor que añada un placeholder image vacío al canvas.
     *  Si el callback devuelve customId, regeneramos los invites incluyendo
     *  la nueva capa. */
    const addEmptySlot = async () => {
        if (!onAddEmptySlot) return;
        setAddingSlot(true);
        setError(null);
        try {
            const newCustomId = await onAddEmptySlot();
            if (!newCustomId) throw new Error("No se pudo añadir el slot");
            // Generar invite para la nueva capa. La regeneración bulk reutiliza
            // los existentes (skip_existing_pending) y solo crea el nuevo.
            const updatedLayerIds = [...layers.map(l => l.customId), newCustomId];
            const res = await fetch("/api/collaborator-invites/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId,
                    layer_ids: updatedLayerIds,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo generar el invite");
            setInvites(data.invites as Invite[]);
            setRoles(prev => ({ ...prev, [newCustomId]: "Slot extra" }));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
        } finally {
            setAddingSlot(false);
        }
    };

    const galleryWhatsappLink = (token: string, role: string) => {
        const url = linkFor(token);
        const flyerLabel = projectName ? `del flyer "${projectName}"` : "del flyer";
        const roleLabel = role.trim() ? ` (${role.trim()})` : "";
        const msg = encodeURIComponent(
            `¡Hola${roleLabel}! Súbeme tu foto para mi galería ${flyerLabel}: ${url}`,
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

                    {/* Barra de progreso — muestra cuántas fotos han llegado.
                        Auto-refresca cada 30s. */}
                    {progress.total > 0 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-white">
                                    {progress.done} de {progress.total} completadas
                                </span>
                                <span className="text-[11px] font-bold" style={{
                                    color: progress.pct === 100 ? "#34d399" : "#c084fc",
                                }}>
                                    {progress.pct}%
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${progress.pct}%`,
                                        background: progress.pct === 100
                                            ? "linear-gradient(90deg, #34d399, #10b981)"
                                            : "linear-gradient(90deg, #a855f7, #ec4899)",
                                    }}
                                />
                            </div>
                            {progress.done < progress.total && (
                                <p className="text-[10px] text-gray-500 mt-1.5">
                                    Faltan {progress.total - progress.done}. Te avisamos por email + campana cuando llegue cada una.
                                </p>
                            )}
                            {progress.pct === 100 && (
                                <p className="text-[10px] text-emerald-400 mt-1.5 font-bold">
                                    ¡Completado! Todas las fotos recibidas.
                                </p>
                            )}
                        </div>
                    )}
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
                            const status = inv ? statusByToken[inv.token] : undefined;
                            const isDone = !!status?.usedAt;
                            return (
                                <div
                                    key={layer.customId}
                                    className="rounded-xl p-3 flex gap-3 items-start transition-colors"
                                    style={{
                                        background: isDone ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.04)",
                                        border: isDone ? "1px solid rgba(16,185,129,0.30)" : "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    {/* Thumbnail si está disponible, si no un placeholder */}
                                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 flex items-center justify-center">
                                        {layer.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={layer.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : isDone ? (
                                            <CheckCircle2 size={20} className="text-emerald-400" />
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
                                            disabled={isDone}
                                            className="w-full px-2 py-1.5 rounded-md text-xs bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-gray-600 focus:border-purple-500/40 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                        {/* Status badge: pendiente vs recibida */}
                                        {inv && (
                                            isDone ? (
                                                <p className="text-[11px] mt-1.5 flex items-center gap-1.5 font-bold text-emerald-400">
                                                    <CheckCircle2 size={11} />
                                                    Recibida{status?.collaboratorName ? ` de ${status.collaboratorName}` : ""}
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="text-[11px] mt-1.5 flex items-center gap-1.5 text-amber-400">
                                                        <Clock size={11} />
                                                        Pendiente
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate font-mono">
                                                        {linkFor(inv.token)}
                                                        {inv.reused && <span className="ml-2 text-emerald-400">· reutilizado</span>}
                                                    </p>
                                                </>
                                            )
                                        )}
                                    </div>

                                    {inv && !isDone && (
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

                        {/* ── Sección galería: invites SIN slot ─────────────── */}
                        {galleryInvites.length > 0 && (
                            <>
                                <div className="pt-3 pb-1 px-1">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                        <FolderOpen size={12} /> Personas extra (van a Colaboradores)
                                    </p>
                                </div>
                                {galleryInvites.map((g, idx) => (
                                    <div
                                        key={g.token}
                                        className="rounded-xl p-3 flex gap-3 items-start"
                                        style={{
                                            background: "rgba(255,255,255,0.02)",
                                            border: "1px dashed rgba(255,255,255,0.10)",
                                        }}
                                    >
                                        <div className="shrink-0 w-14 h-14 rounded-lg bg-white/[0.04] border border-dashed border-white/10 flex items-center justify-center">
                                            <FolderOpen size={16} className="text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={g.role}
                                                onChange={(e) =>
                                                    setGalleryInvites(prev => prev.map((it, i) => i === idx ? { ...it, role: e.target.value } : it))
                                                }
                                                placeholder={`Persona ${idx + 1} (ej. Bailarín extra, fotógrafo...)`}
                                                maxLength={60}
                                                className="w-full px-2 py-1.5 rounded-md text-xs bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-gray-600 focus:border-purple-500/40 focus:outline-none"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1 truncate font-mono">
                                                {linkFor(g.token)} <span className="text-gray-600">· se guarda en Colaboradores</span>
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col gap-1.5">
                                            <button
                                                onClick={() => void copy(g.token)}
                                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all text-white"
                                                style={{
                                                    background: "rgba(255,255,255,0.06)",
                                                    border: "1px solid rgba(255,255,255,0.10)",
                                                }}
                                            >
                                                {copiedToken === g.token ? (
                                                    <><Check size={11} className="text-emerald-400" /> Copiado</>
                                                ) : (
                                                    <><Copy size={11} /> Copiar</>
                                                )}
                                            </button>
                                            <a
                                                href={galleryWhatsappLink(g.token, g.role)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-white transition-all hover:scale-[1.02]"
                                                style={{ background: "#25D366" }}
                                            >
                                                <MessageCircle size={11} /> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* ── Botones para añadir más personas ──────────────── */}
                        <div className="pt-3 flex flex-wrap gap-2">
                            <button
                                onClick={() => void addGalleryInvite()}
                                disabled={addingGallery}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                                style={{
                                    background: "rgba(168,85,247,0.15)",
                                    border: "1px solid rgba(168,85,247,0.40)",
                                }}
                                title="Genera un link extra cuya foto va a Mis Recursos > Colaboradores (no al flyer directamente)"
                            >
                                {addingGallery ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                Añadir persona a galería
                            </button>
                            {onAddEmptySlot && (
                                <button
                                    onClick={() => void addEmptySlot()}
                                    disabled={addingSlot}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                                    style={{
                                        background: "rgba(236,72,153,0.12)",
                                        border: "1px solid rgba(236,72,153,0.40)",
                                    }}
                                    title="Añade un nuevo placeholder de foto al flyer y genera su link. Tendrás que reposicionarlo después."
                                >
                                    {addingSlot ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                    Añadir slot al flyer
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] text-gray-500 pt-2 leading-relaxed">
                            Cuando un colaborador suba su foto, se colocará automáticamente en su capa y recibirás email + notificación.
                            Los links caducan en 7 días. Si vuelves a este wizard, los links pendientes se reutilizan (no se generan duplicados).
                            <br />
                            <span className="text-gray-600">
                                ¿Más personas que capas? Usa <b>Añadir persona a galería</b> — la foto llegará a tu sección de Colaboradores para que la metas tú al flyer cuando quieras.
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
