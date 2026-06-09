"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useAuth } from "@/hooks/useAuth";

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

  // Init UNA vez al mount del componente cliente
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
    if (!key) {
      // No bloquea — solo loguea en dev. Si esta en prod sin key, fallaron
      // las env vars de Vercel.
      if (process.env.NODE_ENV === "development") {
        console.info("[posthog] sin NEXT_PUBLIC_POSTHOG_KEY, tracking desactivado");
      }
      return;
    }
    if (posthog.__loaded) return; // ya inicializado

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
  }, []);

  // Identify cuando hay usuario logueado (con su email + id de Supabase)
  useEffect(() => {
    if (!posthog.__loaded) return;
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
      });
    } else {
      // Logout o sesion expirada → reset
      posthog.reset();
    }
  }, [user]);

  // Pageview manual cada vez que cambia la ruta
  useEffect(() => {
    if (!posthog.__loaded) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
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
    if (!posthog.__loaded) return;
    posthog.capture(name, properties);
  } catch (e) {
    // Nunca dejar que tracking rompa funcionalidad
    console.warn("[posthog] track failed:", e);
  }
}
