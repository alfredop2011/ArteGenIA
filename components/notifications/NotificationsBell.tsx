"use client";

/**
 * Campana de notificaciones del header. Botón con badge contador + dropdown
 * con lista de notificaciones recientes. Click en un item lo marca como
 * leído y navega al destino contextual.
 *
 * Cubre estos tipos por ahora (extensible):
 *   - collaborator_photo_received: foto subida por colaborador via
 *     "Solicitar foto". Click → /editor/{project_id} si auto_applied,
 *     o /mis-recursos?tab=colaboradores si no.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ImageIcon, CheckCheck, Sparkles } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";

export default function NotificationsBell() {
    const { items, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleClick = async (n: NotificationItem) => {
        if (!n.read_at) await markRead(n.id);
        setOpen(false);
        const target = getNavTarget(n);
        if (target) router.push(target);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Notificaciones"
                className="hidden sm:flex w-8 h-8 rounded-full border border-ag items-center justify-center text-ag-muted hover:text-ag-primary transition-colors relative"
            >
                <Bell size={15} strokeWidth={1.8} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-[var(--header-bg,#0a0a14)] shadow-md">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    {/* Backdrop para cerrar al click fuera */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        className="absolute right-0 top-10 w-80 max-h-[70vh] rounded-2xl border shadow-2xl overflow-hidden z-50 flex flex-col"
                        style={{
                            background: "var(--home-bg-soft, #16161f)",
                            borderColor: "var(--home-card-border, rgba(255,255,255,0.08))",
                        }}
                    >
                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold" style={{ color: "var(--home-text, #fff)" }}>
                                    Notificaciones
                                </p>
                                {unreadCount > 0 && (
                                    <p className="text-[10px] text-gray-500">
                                        {unreadCount} sin leer
                                    </p>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => void markAllRead()}
                                    className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 transition-colors"
                                    title="Marcar todo como leído"
                                >
                                    <CheckCheck size={12} /> Todo leído
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {items.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <Bell size={28} className="mx-auto text-gray-600 mb-3" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-500">No tienes notificaciones todavía.</p>
                                    <p className="text-[10px] text-gray-600 mt-1">
                                        Aquí verás cuando un colaborador suba una foto que solicitaste.
                                    </p>
                                </div>
                            ) : (
                                items.map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => void handleClick(n)}
                                        className={`w-full px-4 py-3 text-left flex gap-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-b-0 ${
                                            n.read_at ? "opacity-60" : ""
                                        }`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            <NotificationIcon type={n.type} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12.5px] font-semibold leading-tight" style={{ color: "var(--home-text, #fff)" }}>
                                                {renderTitle(n)}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                                {renderBody(n)}
                                            </p>
                                            <p className="text-[10px] text-gray-600 mt-1">
                                                {relativeTime(n.created_at)}
                                            </p>
                                        </div>
                                        {!n.read_at && (
                                            <span className="shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-1.5 shadow-sm shadow-purple-500/50" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function NotificationIcon({ type }: { type: string }) {
    if (type === "collaborator_photo_received") {
        return (
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <ImageIcon size={14} className="text-emerald-400" strokeWidth={2.2} />
            </div>
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Sparkles size={14} className="text-purple-400" strokeWidth={2.2} />
        </div>
    );
}

function renderTitle(n: NotificationItem): string {
    if (n.type === "collaborator_photo_received") {
        const name = n.payload?.collaborator_name as string | undefined;
        return name ? `${name} ha subido su foto` : "Foto recibida";
    }
    return "Notificación";
}

function renderBody(n: NotificationItem): string {
    if (n.type === "collaborator_photo_received") {
        const auto = n.payload?.auto_applied as boolean | undefined;
        const title = n.payload?.project_title as string | undefined;
        const flyer = title ? `"${title}"` : "tu flyer";
        return auto
            ? `Ya está colocada en ${flyer}. Abre el editor para revisarla.`
            : `Está guardada en Colaboradores, lista para arrastrar a ${flyer}.`;
    }
    return "";
}

function getNavTarget(n: NotificationItem): string | null {
    if (n.type === "collaborator_photo_received") {
        const auto = n.payload?.auto_applied as boolean | undefined;
        const pid = n.payload?.project_id as string | undefined;
        if (auto && pid) return `/editor/${pid}`;
        return "/mis-recursos?tab=colaboradores";
    }
    return null;
}

/** Tiempo relativo simple. Sin lib externa para no sumar bundle. */
function relativeTime(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "ahora mismo";
    const m = Math.floor(seconds / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} día${d === 1 ? "" : "s"}`;
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
