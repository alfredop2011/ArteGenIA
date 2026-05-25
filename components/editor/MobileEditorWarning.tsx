"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Monitor, AlertTriangle, ArrowLeft } from "lucide-react";

/**
 * MobileEditorWarning
 *
 * Wrapper que muestra un aviso fullscreen en mobile (< md breakpoint)
 * explicando que el editor funciona mejor desde desktop, con boton
 * "Continuar igualmente" si el usuario quiere proseguir.
 *
 * No bloquea desktop ni tablet horizontal (>= 768px).
 *
 * Uso:
 *   <MobileEditorWarning>
 *     <GeneratedEditor ... />
 *   </MobileEditorWarning>
 */
export default function MobileEditorWarning({ children }: { children: ReactNode }) {
    const [isMobile, setIsMobile] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Detecta viewport mobile en cliente (no se puede en SSR)
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        setChecked(true);

        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Hasta que comprobamos viewport en cliente, renderizamos hijos para no flickear desktop
    if (!checked) return <>{children}</>;

    // Desktop: pasa directo
    if (!isMobile) return <>{children}</>;

    // Mobile y ya acepto continuar: pasa al editor
    if (acknowledged) return <>{children}</>;

    // Mobile sin acknowledge: muestra aviso
    return (
        <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <Monitor size={36} strokeWidth={1.6} className="text-purple-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">
                Editor mejor desde ordenador
            </h1>

            <p className="text-sm text-gray-400 leading-relaxed mb-2 max-w-sm">
                El editor de flyers usa paneles laterales y arrastre de capas
                pensados para pantalla grande.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-sm">
                Para mejor experiencia, abre <span className="text-yellow-400 font-semibold">artegenia.vercel.app</span> desde un ordenador.
            </p>

            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-8 max-w-sm">
                <AlertTriangle size={18} strokeWidth={2} className="text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-300 text-left">
                    En mobile algunas funciones (paneles, arrastre, edicion de texto) pueden no funcionar correctamente.
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link
                    href="/templates"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-purple-600 active:bg-purple-700 transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={2.2} />
                    Volver a plantillas
                </Link>

                <button
                    onClick={() => setAcknowledged(true)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 active:text-white transition-colors"
                >
                    Continuar igualmente
                </button>
            </div>
        </div>
    );
}
