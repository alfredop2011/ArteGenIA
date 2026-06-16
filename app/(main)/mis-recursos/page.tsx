"use client";

/**
 * /mis-recursos — Fase Z.15. Hub unificado de "Mis flyers" + "Mis creaciones".
 *
 * Antes eran 2 páginas separadas (/projects, /mis-creaciones) que confundían
 * al usuario porque "creaciones" sonaba a flyers. Ahora 1 sola página con
 * 2 tabs claros:
 *   - Flyers     → proyectos completos editables (tabla projects)
 *   - Imágenes   → assets sueltos reutilizables (tabla user_assets)
 *
 * El tab inicial se controla por ?tab=flyers|imagenes — útil para que los
 * redirects de /projects y /mis-creaciones aterricen en el tab correcto.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, FolderOpen, ImageIcon, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import FlyersTab from "./_components/FlyersTab";
import ImagenesTab from "./_components/ImagenesTab";
import ColaboradoresTab from "./_components/ColaboradoresTab";

type TabKey = "flyers" | "imagenes" | "colaboradores";

function MisRecursosInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { t } = useLocale();

    const initialTab: TabKey = (() => {
        const q = searchParams.get("tab");
        if (q === "imagenes") return "imagenes";
        if (q === "colaboradores") return "colaboradores";
        return "flyers";
    })();
    const [tab, setTab] = useState<TabKey>(initialTab);

    // Actualiza ?tab=... sin scroll para que back/forward funcione bien
    const changeTab = (newTab: TabKey) => {
        setTab(newTab);
        router.replace(`/mis-recursos?tab=${newTab}`, { scroll: false });
    };

    if (!authLoading && !user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Lock size={28} strokeWidth={1.8} />
                </div>
                <h2 className="text-2xl font-black mb-2">Inicia sesión para ver tus recursos</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                    Aquí se guardan tus flyers y todas tus imágenes IA, listas para reutilizar.
                </p>
                <Link href="/" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                    {t("projects.loginRequired.cta")}
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
                {/* Header */}
                <div className="mb-5 sm:mb-7">
                    <h1 className="text-2xl sm:text-3xl font-black mb-1" style={{ color: "var(--home-text)" }}>
                        Mis Recursos
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm">
                        Tus flyers y todas tus imágenes IA en un solo lugar.
                    </p>
                </div>

                {/* Tabs principales */}
                <div className="flex gap-1 mb-6 border-b border-white/[0.08] overflow-x-auto">
                    <TabButton
                        icon={<FolderOpen size={16} strokeWidth={2} />}
                        label="Flyers"
                        active={tab === "flyers"}
                        onClick={() => changeTab("flyers")}
                    />
                    <TabButton
                        icon={<ImageIcon size={16} strokeWidth={2} />}
                        label="Imágenes"
                        active={tab === "imagenes"}
                        onClick={() => changeTab("imagenes")}
                    />
                    <TabButton
                        icon={<Users size={16} strokeWidth={2} />}
                        label="Colaboradores"
                        active={tab === "colaboradores"}
                        onClick={() => changeTab("colaboradores")}
                    />
                </div>

                {/* Contenido del tab */}
                {tab === "flyers" && <FlyersTab />}
                {tab === "imagenes" && <ImagenesTab />}
                {tab === "colaboradores" && <ColaboradoresTab />}
            </div>
        </main>
    );
}

function TabButton({ icon, label, active, onClick }: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors shrink-0 ${
                active ? "text-yellow-400" : "text-gray-400 hover:text-white"
            }`}
        >
            {icon}
            {label}
            {active && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-yellow-400" />
            )}
        </button>
    );
}

export default function MisRecursosPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen" style={{ background: "var(--home-bg)" }} />
        }>
            <MisRecursosInner />
        </Suspense>
    );
}
