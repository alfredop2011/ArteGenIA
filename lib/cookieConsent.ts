/**
 * Cookie consent helpers (Fase Z.21 — RGPD compliance).
 *
 * Centraliza la gestión de consent en localStorage. Lo usan:
 *   - <CookieBanner> para mostrar/ocultar y persistir la elección
 *   - <PostHogProvider> para no inicializar el SDK sin consent analytics
 *   - <Footer> para botón "Gestionar cookies" que reabre el banner
 *
 * Modelo: consent básico en 2 categorías:
 *   - necessary: siempre true (auth, créditos, no requiere opt-in)
 *   - analytics: opt-in (PostHog tracking)
 *
 * Si no hay decisión guardada, devolvemos null → banner debe mostrarse.
 * Tras decidir, persistimos { necessary: true, analytics: bool, ts }.
 *
 * Eventos en window para que PostHogProvider reaccione sin refresh:
 *   "cookieConsentChanged" — dispatchado tras setConsent().
 */

export const COOKIE_CONSENT_KEY = "ag_cookie_consent_v1";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  ts: number;
};

/** Lee el consent guardado. Devuelve null si nunca decidió o storage no disponible. */
export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.necessary !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda el consent y dispatcha evento global para listeners. */
export function setConsent(analytics: boolean): void {
  if (typeof window === "undefined") return;
  const data: CookieConsent = { necessary: true, analytics, ts: Date.now() };
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: data }));
  } catch {
    /* ignore — localStorage puede no estar disponible */
  }
}

/** Resetea el consent (útil para botón "cambiar mis preferencias"). */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: null }));
  } catch {
    /* ignore */
  }
}

/** Helper rápido: ¿el user ha permitido analytics? */
export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}
