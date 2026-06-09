/**
 * Sentry — server config (Next.js 16 instrumentation).
 *
 * Captura errores en server-side (route handlers, server components).
 * Solo se inicializa si SENTRY_DSN existe.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production",
    });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

// Capture errors on request lifecycle (Next.js 16)
export async function onRequestError(
  err: unknown,
  request: Parameters<typeof import("@sentry/nextjs").captureRequestError>[1],
  context: Parameters<typeof import("@sentry/nextjs").captureRequestError>[2],
) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
