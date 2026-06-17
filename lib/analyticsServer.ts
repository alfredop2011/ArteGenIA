/**
 * PostHog server-side tracking (P2).
 *
 * El cliente (lib/analytics.ts + posthog-js) captura eventos del browser,
 * pero la conversión pagada y la cancelación dependen del webhook de
 * Stripe — el browser puede haberse cerrado tras pagar. Server-side
 * garantiza que esos eventos críticos siempre llegan.
 *
 * distinct_id = user.id de Supabase. Igual que en el cliente
 * (PostHogProvider hace identify con user.id), así PostHog une las
 * sesiones browser + server bajo la misma persona.
 *
 * Si NEXT_PUBLIC_POSTHOG_KEY no está configurado, las funciones son
 * NO-OP (igual que email.ts).
 */

import { PostHog } from "posthog-node";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";

let client: PostHog | null = null;
function getClient(): PostHog | null {
  if (!apiKey) return null;
  if (!client) {
    client = new PostHog(apiKey, { host, flushAt: 1, flushInterval: 0 });
  }
  return client;
}

/** Captura un evento server-side. Fire-and-forget desde el caller; aquí
 *  hacemos `await shutdown()` para no perder eventos en serverless
 *  (Vercel termina la lambda en cuanto la response sale). */
async function capture(distinctId: string, event: string, properties: Record<string, unknown> = {}) {
  const ph = getClient();
  if (!ph) {
    console.info(`[analyticsServer] sin POSTHOG_KEY — skip "${event}" para ${distinctId}`);
    return;
  }
  try {
    ph.capture({ distinctId, event, properties });
    // Crítico en serverless: si no esperamos al flush, Vercel mata la
    // lambda antes de que el HTTP request a PostHog salga.
    await ph.shutdown();
    client = null; // próxima llamada crea cliente nuevo (lambdas frías)
  } catch (e) {
    console.error("[analyticsServer] capture fallo:", e);
  }
}

/** Tras checkout.session.completed: conversión pagada. */
export async function trackUpgradeCompleted(
  userId: string,
  payload: { plan: "pro" | "enterprise"; interval: "monthly" | "yearly"; amount_cents?: number },
): Promise<void> {
  await capture(userId, "upgrade_completed", payload);
}

/** Tras customer.subscription.deleted: cancelación efectiva al final del periodo. */
export async function trackSubscriptionCanceled(
  userId: string,
  payload: { plan?: string; reason?: string },
): Promise<void> {
  await capture(userId, "subscription_canceled", payload);
}

/** Tras invoice.payment_failed: tarjeta rechazada — útil para detectar
 *  churn involuntario en el embudo. */
export async function trackPaymentFailed(
  userId: string,
  payload: { attempt_count: number; amount_cents?: number },
): Promise<void> {
  await capture(userId, "payment_failed", payload);
}
