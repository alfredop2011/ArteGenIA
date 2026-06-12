import Stripe from "stripe";

/**
 * Cliente Stripe server-side (no usar en client components).
 *
 * Requiere STRIPE_SECRET_KEY en variables de entorno. La key empieza por:
 * - sk_test_... para entorno de pruebas
 * - sk_live_... para producción
 *
 * En desarrollo usa sk_test_; en producción cambiar a sk_live_ y rotar la
 * webhook secret correspondiente.
 */

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey && typeof window === "undefined") {
  console.warn("[stripe] STRIPE_SECRET_KEY no definida — checkout fallará.");
}

export const stripe = new Stripe(apiKey ?? "sk_test_dummy", {
  // Pinear API version evita breakages cuando Stripe actualiza.
  // Si actualizas, lee changelog: https://stripe.com/docs/upgrades
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

/** Price IDs recurrentes mensuales por plan. Crear en Stripe Dashboard:
 *  Products → Add product → "ArteGenIA Pro" (9,99€/mes) o
 *  "ArteGenIA Enterprise" (34,99€/mes) → copiar Price ID. */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const ENTERPRISE_PRICE_ID = process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "";

export type PlanKey = "pro" | "enterprise";

/** Mapea plan key → price ID Stripe. Usado por checkout para saber qué
 *  product line item suscribir y por webhook para detectar qué plan se
 *  compró (comparando subscription.items[0].price.id). */
export function priceIdFor(plan: PlanKey): string {
  return plan === "enterprise" ? ENTERPRISE_PRICE_ID : PRO_PRICE_ID;
}

/** Reverse lookup: dado un price ID, ¿qué plan es? Devuelve null si
 *  el ID no coincide con ningún price configurado (puede pasar si el
 *  user tenía un plan legacy borrado). */
export function planFromPriceId(priceId: string): PlanKey | null {
  if (priceId && priceId === ENTERPRISE_PRICE_ID) return "enterprise";
  if (priceId && priceId === PRO_PRICE_ID) return "pro";
  return null;
}
