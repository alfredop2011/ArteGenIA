"use client";

/**
 * ImagenesTab — contenido del tab "Imágenes" dentro de /mis-recursos.
 *
 * Es el legacy de /mis-creaciones/page.tsx extraído como componente.
 * Mantiene storage bar + filtros por tipo + grid de assets con acciones
 * (descargar, borrar). El wrapper de auth gate vive en page.tsx.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import {
    ASSET_TYPE_LABEL,
    ASSET_TYPE_ICON,
    type AssetType,
} from "@/lib/storage";

type Asset = {
    id: string;
    user_id: string;
    type: AssetType;
    url: string;
    name: string;
    size_bytes: number;
    width: number | null;
    height: number | null;
    source_module: string | null;
    created_at: string;
};

type StorageInfo = {
    used_bytes: number;
    limit_bytes: number;
    used_human: string;
    limit_human: string;
    percent: number;
    plan: string;
};

type FilterType = "all" | AssetType;

export default function ImagenesTab() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [storage, setStorage] = useState<StorageInfo | null>(null);
    const [filter, setFilter] = useState<FilterType>("all");
    const [loading, setLoading] = useState(true);

    const fetchAssets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch("/api/assets", { cache: "no-store" });
            const data = await res.json();
            if (data.authenticated) {
                setAssets(data.assets ?? []);
                setStorage(data.storage ?? null);
            }
        } catch (e) {
            console.error("[mis-recursos] fetch assets failed:", e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) void fetchAssets();
    }, [authLoading, fetchAssets]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("¿Borrar esta imagen? No se puede deshacer.")) return;
        try {
            const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.error || "No se pudo borrar");
                return;
            }
            setAssets((prev) => prev.filter((a) => a.id !== id));
            toast.success("Borrado");
            void fetchAssets();
        } catch {
            toast.error("Error de conexión");
        }
    }, [fetchAssets, toast]);

    const handleDownload = useCallback(async (asset: Asset) => {
        try {
            const res = await fetch(asset.url);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = asset.name || `recurso-${asset.id}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("Descargado");
        } catch {
            toast.error("No se pudo descargar");
        }
    }, [toast]);

    const filtered = filter === "all" ? assets : assets.filter((a) => a.type === filter);
    const counts: Record<string, number> = { all: assets.length };
    for (const a of assets) counts[a.type] = (counts[a.type] ?? 0) + 1;

    return (
        <div>
            {/* Storage bar */}
            {storage && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6">
                    <div className="flex items-center justify-between mb-2 text-[11.5px]">
                        <span className="text-gray-400">
                            Almacenamiento: <span className="font-bold text-white">{storage.used_human}</span> / {storage.limit_human}
                        </span>
                        <span className={`font-bold ${storage.percent >= 80 ? "text-amber-300" : "text-emerald-300"}`}>
                            {storage.percent}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                storage.percent >= 80
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                            }`}
                            style={{ width: `${Math.min(storage.percent, 100)}%` }}
                        />
                    </div>
                    {storage.percent >= 80 && storage.plan === "free" && (
                        <p className="text-[10.5px] text-amber-300 mt-2">
                            ⚠ Almacenamiento casi lleno.{" "}
                            <Link href="/pricing" className="underline">Sube a Pro</Link>{" "}
                            para 5 GB de espacio.
                        </p>
                    )}
                </div>
            )}

            {/* Filtros tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-3 sm:-mx-5 px-3 sm:px-5">
                <FilterTab label="Todas" icon="📂" count={counts.all ?? 0} active={filter === "all"} onClick={() => setFilter("all")} />
                {(Object.keys(ASSET_TYPE_LABEL) as AssetType[]).map((t) => (
                    <FilterTab
                        key={t}
                        label={ASSET_TYPE_LABEL[t]}
                        icon={ASSET_TYPE_ICON[t]}
                        count={counts[t] ?? 0}
                        active={filter === t}
                        onClick={() => setFilter(t)}
                    />
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onDelete={() => handleDelete(asset.id)}
                            onDownload={() => handleDownload(asset)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterTab({ label, icon, count, active, onClick }: {
    label: string; icon: string; count: number; active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                active
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                    : "bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.06]"
            }`}
        >
            <span>{icon}</span>
            <span className="text-[12.5px] font-bold">{label}</span>
            {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    active ? "bg-purple-500/40 text-purple-100" : "bg-white/[0.06] text-gray-400"
                }`}>{count}</span>
            )}
        </button>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-16 px-4">
            <div className="text-[48px] mb-4">🎨</div>
            <p className="text-[15px] font-bold mb-1">Aún no tienes imágenes guardadas</p>
            <p className="text-[12.5px] text-gray-400 mb-6 max-w-md mx-auto">
                Empieza creando una foto sin fondo o usando las herramientas IA.
                Se guardarán aquí para que las reuses en tus flyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                    href="/quitar-fondo"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[12.5px]"
                >
                    ✂️ Quitar fondo
                </Link>
                <Link
                    href="/templates"
                    className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[12.5px]"
                >
                    📐 Ver plantillas
                </Link>
            </div>
        </div>
    );
}

function AssetCard({ asset, onDelete, onDownload }: {
    asset: Asset; onDelete: () => void; onDownload: () => void;
}) {
    return (
        <div className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-purple-500/40 transition-colors">
            <div className="aspect-square relative" style={{
                backgroundImage: "linear-gradient(45deg, #2a2a3a 25%, transparent 25%), linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a3a 75%), linear-gradient(-45deg, transparent 75%, #2a2a3a 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                backgroundColor: "#1a1a24",
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.name} className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                        onClick={onDownload}
                        title="Descargar"
                        className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white flex items-center justify-center"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        title="Borrar"
                        className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm text-white flex items-center justify-center"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="p-3">
                <p className="text-[11.5px] font-bold truncate">{asset.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                    {ASSET_TYPE_ICON[asset.type]} {ASSET_TYPE_LABEL[asset.type]}
                </p>
            </div>
        </div>
    );
}
