"use client";

/**
 * CookieBanner — RGPD consent (Fase Z.21).
 *
 * Aparece UNA VEZ tras la primera visita si no hay consent guardado.
 * 3 opciones: Aceptar todas / Solo necesarias / Personalizar.
 *
 * Visible siempre fixed bottom hasta que el user decida. No bloquea el uso
 * de la app, solo el tracking de analytics (PostHog).
 *
 * El botón "Personalizar" abre /cookies (ya existe en /(main)/cookies)
 * para explicación detallada de qué cookies se usan.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/cookieConsent";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  // null = no sabemos aún (server-side o sin localStorage)
  // false = ya decidió (no mostrar)
  // true = nunca decidió (mostrar)
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);

  useEffect(() => {
    setShouldShow(getConsent() === null);
  }, []);

  const acceptAll = () => {
    setConsent(true);
    setShouldShow(false);
  };

  const acceptNecessaryOnly = () => {
    setConsent(false);
    setShouldShow(false);
  };

  if (shouldShow !== true) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-3 sm:p-4 pointer-events-none">
      <div
        className="max-w-3xl mx-auto rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto backdrop-blur-xl"
        style={{ background: "rgba(20, 18, 32, 0.95)" }}
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-desc"
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center">
            <Cookie size={18} strokeWidth={2}/>
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="cookie-banner-title" className="text-white text-sm sm:text-base font-bold mb-1">
              Cookies y privacidad
            </h2>
            <p id="cookie-banner-desc" className="text-[12px] sm:text-[13px] text-gray-300 leading-relaxed">
              Usamos cookies necesarias para que la app funcione (sesión, créditos)
              y cookies de análisis para entender qué funciona y qué no. Tú decides.{" "}
              <Link href="/cookies" className="text-purple-300 hover:underline">
                Más información
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                onClick={acceptNecessaryOnly}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-gray-200 font-bold text-[12.5px] transition-colors"
              >
                Solo necesarias
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white font-bold text-[12.5px] transition-all"
              >
                Aceptar todas
              </button>
            </div>
          </div>
          {/* Botón cerrar = solo necesarias (interpretación común RGPD) */}
          <button
            onClick={acceptNecessaryOnly}
            className="shrink-0 w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            aria-label="Cerrar (acepta solo necesarias)"
          >
            <X size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}
