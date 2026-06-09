/**
 * Sentry — client config (Next.js 16 instrumentation hook).
 *
 * Captura errores no manejados en el browser. Solo se inicializa si la
 * env var SENTRY_DSN esta configurada — sin ella, no se carga (cero
 * impacto en dev local).
 *
 * Setup en Vercel:
 *   NEXT_PUBLIC_SENTRY_DSN="https://...@oXXXXX.ingest.sentry.io/XXXXX"
 *
 * Cuotas free de Sentry: 5k errores/mes, suficiente para MVP.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Sample 10% de sesiones para tener traces pero no llenar la cuota
    tracesSampleRate: 0.1,
    // No mandar errores en desarrollo local
    enabled: process.env.NODE_ENV === "production",
    // Filtrar errores comunes que no son bugs reales
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed",
      "Non-Error promise rejection captured",
      // Extensiones del browser
      /chrome-extension/,
      /safari-extension/,
    ],
    beforeSend(event) {
      // No enviar errores en dev
      if (process.env.NODE_ENV !== "production") return null;
      return event;
    },
  });
}

// Required exports para Next.js 16
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
