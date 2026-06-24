"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export type NotificationItem = {
    id: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Record<string, any>;
    read_at: string | null;
    created_at: string;
};

/**
 * Hook de notificaciones in-app. Polling cada 60s mientras el componente
 * esté montado. Devuelve items + contador de no leídas + helpers para
 * marcar como leídas.
 *
 * Solo hace fetch si hay user logueado (evita 401 ruidosos en consola
 * cuando el componente se monta antes de que useAuth resuelva).
 *
 * Polling 60s es suficiente para el evento principal (foto recibida de
 * colaborador), que NO es ultra-urgente — el user ya está cubierto por
 * email transactional. Si en el futuro queremos instantaneidad, swap
 * por Supabase Realtime (un canal subscribe a notifications WHERE user_id
 * elimina la latencia).
 */
export function useNotifications() {
    const { user } = useAuth();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    // Cancelación: si el componente se desmonta o el user cambia, evitar
    // setState en una promise zombie.
    const abortRef = useRef<AbortController | null>(null);

    const fetchOnce = useCallback(async () => {
        if (!user) return;
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=20", { signal: ctrl.signal });
            if (!res.ok) return;
            const data = await res.json() as { items: NotificationItem[]; unread_count: number };
            if (ctrl.signal.aborted) return;
            setItems(data.items);
            setUnreadCount(data.unread_count);
        } catch (e) {
            if ((e as Error).name !== "AbortError") {
                console.warn("[useNotifications] fetch failed", e);
            }
        } finally {
            if (!ctrl.signal.aborted) setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setUnreadCount(0);
            return;
        }
        void fetchOnce();
        const interval = setInterval(() => { void fetchOnce(); }, 60_000);
        return () => {
            clearInterval(interval);
            abortRef.current?.abort();
        };
    }, [user, fetchOnce]);

    /** Marca UNA notificación como leída (optimistic update + POST). */
    const markRead = useCallback(async (id: string) => {
        setItems(prev => prev.map(n =>
            n.id === id && !n.read_at
                ? { ...n, read_at: new Date().toISOString() }
                : n,
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: [id] }),
            });
        } catch (e) {
            console.warn("[useNotifications] markRead failed", e);
        }
    }, []);

    /** Marca TODAS las no leídas como leídas. */
    const markAllRead = useCallback(async () => {
        const nowIso = new Date().toISOString();
        setItems(prev => prev.map(n => n.read_at ? n : { ...n, read_at: nowIso }));
        setUnreadCount(0);
        try {
            await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true }),
            });
        } catch (e) {
            console.warn("[useNotifications] markAllRead failed", e);
        }
    }, []);

    return { items, unreadCount, loading, refetch: fetchOnce, markRead, markAllRead };
}
