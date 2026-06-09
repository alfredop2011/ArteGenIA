"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Lock, Loader2, FileText, Sparkles, Scissors, Image as ImageIcon,
  Wand2, Palette, Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

/**
 * /history — Timeline cronológico de actividad del user.
 *
 * Combina dos fuentes:
 *  - `projects` (proyectos guardados): cuando el user crea/edita flyers
 *  - `ai_usage` (operaciones IA): segment-person, refine-hd, etc.
 *
 * Cards orden DESC. Filtros por tipo (chips). RLS de Supabase asegura
 * que cada user solo ve lo suyo (no necesitamos validacion extra aqui).
 *
 * Cuando añadamos tracking de downloads (tabla download_log), se conecta
 * aqui añadiendo una tercera fuente.
 */

// Tipos de entrada en el timeline
type EntryKind = "project_saved" | "ai_segment" | "ai_refine" | "ai_remove_bg" | "ai_generate_bg";

type TimelineEntry = {
  id: string;
  kind: EntryKind;
  title: string;
  subtitle?: string;
  thumbnail?: string | null;
  timestamp: string;
  href?: string;
};

// Mapeo visual por tipo
const KIND_META: Record<EntryKind, { label: string; icon: typeof FileText; accent: string }> = {
  project_saved:   { label: "Flyer guardado",       icon: FileText,  accent: "#a855f7" },
  ai_segment:      { label: "Recortar persona",     icon: Scissors,  accent: "#ec4899" },
  ai_refine:       { label: "Refinado HD",          icon: Wand2,     accent: "#facc15" },
  ai_remove_bg:    { label: "Eliminar fondo",       icon: ImageIcon, accent: "#22d3ee" },
  ai_generate_bg:  { label: "Generar fondo IA",     icon: Sparkles,  accent: "#fb923c" },
};

// Map de action de ai_usage → kind del timeline
function actionToKind(action: string): EntryKind | null {
  if (action.startsWith("segment-person")) return "ai_segment";
  if (action === "refine-hd") return "ai_refine";
  if (action === "remove-bg") return "ai_remove_bg";
  if (action === "generate-bg") return "ai_generate_bg";
  return null;
}

// BCP47 para Intl según locale
const BCP47: Record<string, string> = {
  es: "es-ES", en: "en-US", fr: "fr-FR", pt: "pt-PT",
};

type FilterKey = "all" | EntryKind;

export default function HistoryPage() {
    const { user } = useAuth();
    const { t, locale } = useLocale();
    const [entries, setEntries] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterKey>("all");

    // Carga combinada: projects + ai_usage. Las dos en paralelo via Promise.all.
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const [projRes, aiRes] = await Promise.all([
                    supabase
                        .from("projects")
                        .select("id, title, thumbnail_url, updated_at")
                        .eq("user_id", user.id)
                        .order("updated_at", { ascending: false })
                        .limit(50),
                    supabase
                        .from("ai_usage")
                        .select("id, action, created_at, meta")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(50),
                ]);

                if (projRes.error) throw projRes.error;
                if (aiRes.error) throw aiRes.error;

                const projectEntries: TimelineEntry[] = (projRes.data ?? []).map(p => ({
                    id: `proj-${p.id}`,
                    kind: "project_saved" as const,
                    title: p.title || "Flyer sin título",
                    thumbnail: p.thumbnail_url,
                    timestamp: p.updated_at,
                    href: `/editor/${p.id}`,
                }));

                const aiEntries: TimelineEntry[] = (aiRes.data ?? [])
                    .map(ai => {
                        const kind = actionToKind(ai.action);
                        if (!kind) return null;
                        return {
                            id: `ai-${ai.id}`,
                            kind,
                            title: KIND_META[kind].label,
                            // meta puede tener info extra del flyer pero por ahora omitimos
                            timestamp: ai.created_at,
                        } as TimelineEntry;
                    })
                    .filter((x): x is TimelineEntry => x !== null);

                // Merge + sort DESC por timestamp
                const all = [...projectEntries, ...aiEntries].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                setEntries(all);
                setError(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error cargando historial");
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const filtered = useMemo(() =>
        filter === "all" ? entries : entries.filter(e => e.kind === filter),
        [entries, filter]
    );

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: entries.length };
        for (const e of entries) c[e.kind] = (c[e.kind] ?? 0) + 1;
        return c;
    }, [entries]);

    // No logueado
    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 mb-4 rounded-2xl flex items-center justify-center"
                     style={{ background: "var(--ag-brand-bg)", border: "1px solid var(--ag-brand-border)", color: "var(--ag-brand)" }}>
                    <Lock size={28} strokeWidth={1.8} />
                </div>
                <h2 className="text-2xl font-black mb-2" style={{ color: "var(--home-text)" }}>
                    {t("history.title")}
                </h2>
                <p className="mb-6" style={{ color: "var(--home-text-muted)" }}>
                    Inicia sesión para ver tu historial de actividad.
                </p>
                <Link href="/" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                    Ir al inicio
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-10">

            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: "var(--home-text)" }}>
                    {t("history.title")}
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: "var(--home-text-muted)" }}>
                    Todo lo que has hecho en ArteGenIA: flyers guardados, operaciones de IA, descargas.
                </p>
            </div>

            {/* Filtros */}
            {!loading && entries.length > 0 && (
                <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
                    <Filter size={13} strokeWidth={2} className="shrink-0" style={{ color: "var(--home-text-soft)" }} />
                    <FilterChip
                        active={filter === "all"}
                        onClick={() => setFilter("all")}
                        accent="var(--ag-brand)"
                    >
                        Todo · {counts.all}
                    </FilterChip>
                    {(["project_saved", "ai_segment", "ai_remove_bg", "ai_generate_bg", "ai_refine"] as EntryKind[]).map(k => {
                        const count = counts[k] ?? 0;
                        if (count === 0) return null;
                        const meta = KIND_META[k];
                        return (
                            <FilterChip
                                key={k}
                                active={filter === k}
                                onClick={() => setFilter(k)}
                                accent={meta.accent}
                            >
                                {meta.label} · {count}
                            </FilterChip>
                        );
                    })}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--ag-brand)" }} />
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="rounded-xl p-4 text-sm"
                     style={{ background: "var(--ag-danger-bg)", border: "1px solid var(--ag-danger-border)", color: "var(--ag-danger)" }}>
                    {error}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && entries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                    <div className="w-20 h-20 mb-4 rounded-2xl flex items-center justify-center"
                         style={{ background: "var(--ag-brand-bg)", border: "1px solid var(--ag-brand-border)", color: "var(--ag-brand)" }}>
                        <Palette size={36} strokeWidth={1.6} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "var(--home-text)" }}>
                        Aún no hay actividad
                    </h3>
                    <p className="text-sm mb-6" style={{ color: "var(--home-text-muted)" }}>
                        Cuando crees flyers o uses funciones de IA, aparecerán aquí ordenados por fecha.
                    </p>
                    <Link href="/templates" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                        Explorar plantillas
                    </Link>
                </div>
            )}

            {/* Timeline */}
            {!loading && !error && filtered.length > 0 && (
                <div className="space-y-2">
                    {filtered.map(entry => (
                        <TimelineCard
                            key={entry.id}
                            entry={entry}
                            locale={BCP47[locale] ?? "es-ES"}
                        />
                    ))}
                </div>
            )}

            {/* Empty state for filter */}
            {!loading && !error && entries.length > 0 && filtered.length === 0 && (
                <div className="text-center py-12 text-sm" style={{ color: "var(--home-text-muted)" }}>
                    No hay entradas de este tipo todavía.
                </div>
            )}
        </div>
    );
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────

function FilterChip({
    active, onClick, accent, children,
}: {
    active: boolean;
    onClick: () => void;
    accent: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={active
                ? { background: `${accent}1a`, border: `1px solid ${accent}55`, color: accent }
                : { background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text-muted)" }
            }
        >
            {children}
        </button>
    );
}

function TimelineCard({ entry, locale }: { entry: TimelineEntry; locale: string }) {
    const meta = KIND_META[entry.kind];
    const Icon = meta.icon;
    const accent = meta.accent;

    // Formato relativo + absoluto
    const ts = new Date(entry.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - ts.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let relative: string;
    if (diffMins < 1) relative = "Hace instantes";
    else if (diffMins < 60) relative = `Hace ${diffMins} min`;
    else if (diffHours < 24) relative = `Hace ${diffHours} h`;
    else if (diffDays < 7) relative = `Hace ${diffDays} d`;
    else relative = ts.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

    const exactTime = ts.toLocaleString(locale, {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const content = (
        <div
            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all hover:scale-[1.005]"
            style={{
                background: "var(--home-bg-soft)",
                border: "1px solid var(--home-card-border)",
                cursor: entry.href ? "pointer" : "default",
            }}
        >
            {/* Thumbnail o icono */}
            {entry.thumbnail ? (
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden"
                     style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center"
                     style={{ background: `${accent}1a`, border: `1px solid ${accent}55`, color: accent }}>
                    <Icon size={20} strokeWidth={2} />
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: `${accent}1a`, color: accent }}>
                        {meta.label}
                    </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: "var(--home-text)" }}>
                    {entry.title}
                </h3>
                <p className="text-[11px] sm:text-xs" style={{ color: "var(--home-text-soft)" }} title={exactTime}>
                    {relative}
                </p>
            </div>
        </div>
    );

    return entry.href
        ? <Link href={entry.href} className="block">{content}</Link>
        : content;
}
