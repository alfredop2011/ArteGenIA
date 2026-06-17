"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PostHog } from "posthog-js";
import { useAuth } from "@/hooks/useAuth";
import { hasAnalyticsConsent } from "@/lib/cookieConsent";

/**
 * Instancia de PostHog cargada de forma diferida. El SDK (~190 KB) NO se
 * importa estáticamente: solo se hace `await import("posthog-js")` tras el
 * consentimiento de cookies. Así no entra en el first-load JS de ninguna
 * página. Mientras no esté cargado, `ph` es null y todo es no-op (igual que
 * antes cuando `posthog.__loaded` era false).
 */
let ph: PostHog | null = null;

/**
 * Wrapper de PostHog para Next.js App Router.
 *
 * Inicializa el SDK en el primer mount con la key de env, identifica al
 * usuario cuando hay sesion y trackea pageviews automaticos (incluyendo
 * cambios de ruta con next/navigation, que no disparan reload completo).
 *
 * Configuracion: añadir en Vercel + .env.local:
 *   NEXT_PUBLIC_POSTHOG_KEY="phc_..."
 *   NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"  (EU para GDPR)
 *
 * Si las env vars no estan configuradas (dev local sin posthog), el
 * provider no rompe nada — simplemente no envia eventos.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  // Z.21 — Tracking gateado por consent RGPD. Re-evaluamos cuando el user
  // acepta/rechaza para inicializar diferido sin reload.
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    const onChange = () => setConsented(hasAnalyticsConsent());
    window.addEventListener("cookieConsentChanged", onChange);
    return () => window.removeEventListener("cookieConsentChanged", onChange);
  }, []);

  // Init UNA vez tras consent + key configurada. El SDK se carga de forma
  // diferida (dynamic import) para que no pese en el first-load JS.
  useEffect(() => {
    if (!consented) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
    if (!key) {
      if (process.env.NODE_ENV === "development") {
        console.info("[posthog] sin NEXT_PUBLIC_POSTHOG_KEY, tracking desactivado");
      }
      return;
    }
    if (ph?.__loaded) return; // ya inicializado

    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled || posthog.__loaded) return;
      posthog.init(key, {
        api_host: host,
        // capture_pageview: false porque ya manejamos pageviews manualmente
        // (el SDK no detecta cambios de ruta de next/navigation sin recarga)
        capture_pageview: false,
        capture_pageleave: true,
        // Privacy-friendly: no grabamos sessiones por defecto
        session_recording: { maskAllInputs: true },
        // No enviar IP cruda (GDPR-friendly)
        ip: false,
        persistence: "localStorage+cookie",
      });
      ph = posthog;
      // Capturar el pageview inicial e identificar al usuario actual, ya que
      // los effects de abajo pudieron correr antes de que el SDK cargara.
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      posthog.capture("$pageview", { $current_url: url });
      if (user) posthog.identify(user.id, { email: user.email });
    });
    return () => { cancelled = true; };
    // pathname/searchParams/user se leen como snapshot inicial al cargar el SDK;
    // los effects dedicados de abajo cubren los cambios posteriores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  // Identify cuando hay usuario logueado (con su email + id de Supabase)
  useEffect(() => {
    if (!ph?.__loaded) return;
    if (user) {
      ph.identify(user.id, {
        email: user.email,
      });
    } else {
      // Logout o sesion expirada → reset
      ph.reset();
    }
  }, [user]);

  // Pageview manual cada vez que cambia la ruta
  useEffect(() => {
    if (!ph?.__loaded) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/**
 * Helper para emitir eventos custom desde cualquier componente.
 * Sin import de posthog-js en consumers → menos boilerplate.
 *
 * Uso:
 *   import { trackEvent } from "@/components/analytics/PostHogProvider";
 *   trackEvent("flyer_downloaded", { template_id: 42 });
 */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (!ph?.__loaded) return;
    ph.capture(name, properties);
  } catch (e) {
    // Nunca dejar que tracking rompa funcionalidad
    console.warn("[posthog] track failed:", e);
  }
}
