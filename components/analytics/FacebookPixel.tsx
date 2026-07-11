"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { hasAnalyticsConsent } from "@/lib/cookieConsent";

/**
 * Meta (Facebook) Pixel — medición y optimización de campañas de ads.
 *
 * Distinto de PostHog: PostHog mide el comportamiento DENTRO del producto;
 * el Pixel envía conversiones a Facebook para que el algoritmo de ads pueda
 * medir ROI, optimizar la entrega (buscar gente parecida a quien convierte)
 * y hacer retargeting. Si se paga publicidad en Meta, es imprescindible.
 *
 * RGPD: igual que PostHog, el Pixel SOLO se carga tras consentimiento de
 * cookies de análisis (banner Z.21). Sin consent no se inyecta nada. Por eso
 * NO incluimos el <noscript><img> del snippet estándar: dispararía sin consent.
 *
 * Config: añadir en Vercel + .env.local:
 *   NEXT_PUBLIC_FACEBOOK_PIXEL_ID="1646192946445060"
 * Si no está la env, el componente es no-op (no rompe nada).
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// Módulo-scope: init una sola vez aunque el componente re-monte.
let initialized = false;

/** Inyecta el snippet base de Meta Pixel (una vez) y hace init. */
function loadPixel(id: string) {
  if (initialized || typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.fbq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n: any = (w.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = document.createElement("script");
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    const s = document.getElementsByTagName("script")[0];
    s.parentNode?.insertBefore(t, s);
  }
  w.fbq("init", id);
  initialized = true;
}

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);

  // Gate por consentimiento RGPD (mismo mecanismo que PostHogProvider).
  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    const onChange = () => setConsented(hasAnalyticsConsent());
    window.addEventListener("cookieConsentChanged", onChange);
    return () => window.removeEventListener("cookieConsentChanged", onChange);
  }, []);

  // Init + primer PageView tras el consentimiento.
  useEffect(() => {
    if (!consented || !PIXEL_ID) return;
    loadPixel(PIXEL_ID);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq?.("track", "PageView");
  }, [consented]);

  // PageView en cada cambio de ruta (SPA — Next no recarga la página).
  useEffect(() => {
    if (!initialized) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq?.("track", "PageView");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

/**
 * Emite un evento ESTÁNDAR de Meta Pixel (Purchase, CompleteRegistration,
 * Lead, InitiateCheckout…). No-op si el Pixel no está cargado (sin consent o
 * sin env). Nunca lanza — el tracking jamás debe romper funcionalidad.
 *
 * Uso:
 *   import { trackFbEvent } from "@/components/analytics/FacebookPixel";
 *   trackFbEvent("Purchase", { value: 9.99, currency: "EUR" });
 */
export function trackFbEvent(name: string, params?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq;
    if (typeof fbq !== "function") return;
    fbq("track", name, params);
  } catch {
    /* noop */
  }
}
